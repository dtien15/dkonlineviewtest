document.addEventListener("DOMContentLoaded", () => {
  // --- Khởi tạo VNKeys + simple-keyboard ---
  VNKeys.setMethod("auto");
  const kbContainer = document.querySelector(".simple-keyboard");
  const keyboard = new SimpleKeyboard.default({
    rootElement: kbContainer,
    onKeyPress: (btn) => handleKeyPress(btn),
    display: {
      "{enter}": "Tiếp theo",
      "{bksp}": "Xóa",
      "{shift}": "Shift",
      "{lock}": "Caps",
      "{space}": "Khoảng cách",
      "{tab}": "Tab",
      "{hide}": "Ẩn Bàn Phím", // custom button
    },
    layout: {
      default: [
        "1 2 3 4 5 6 7 8 9 0 {bksp}",
        "q w e r t y u i o p",
        "a s d f g h j k l {enter}",
        "{shift} z x c v b n m {hide}", // chèn nút ở hàng cuối
        "{lock} {space} {tab}",
      ],
    },
    layoutName: "default",
  });

  // --- Bảng gợi ý dấu cho nguyên âm & đ ---
  const diacriticMap = {
    a: [
      "á",
      "à",
      "ả",
      "ã",
      "ạ",
      "â",
      "ấ",
      "ầ",
      "ẩ",
      "ẫ",
      "ậ",
      "ă",
      "ắ",
      "ằ",
      "ẳ",
      "ẵ",
      "ặ",
    ],
    e: ["é", "è", "ẻ", "ẽ", "ẹ", "ê", "ế", "ề", "ể", "ễ", "ệ"],
    i: ["í", "ì", "ỉ", "ĩ", "ị"],
    o: [
      "ó",
      "ò",
      "ỏ",
      "õ",
      "ọ",
      "ô",
      "ố",
      "ồ",
      "ổ",
      "ỗ",
      "ộ",
      "ơ",
      "ớ",
      "ờ",
      "ở",
      "ỡ",
      "ợ",
    ],
    u: ["ú", "ù", "ủ", "ũ", "ụ", "ư", "ứ", "ừ", "ử", "ữ", "ự"],
    y: ["ý", "ỳ", "ỷ", "ỹ", "ỵ"],
    d: ["đ"],
  };

  let activeInput = null;
  let patients = {};

  // --- Load dữ liệu bệnh nhân ---
  fetch("data/patients.json")
    .then((res) => res.json())
    .then((json) => (patients = json))
    .catch(() => alert("Không tải được dữ liệu bệnh nhân."));

  // --- Idle-modal + timeout ---
  let idleTimer = null,
    isModalOpen = false;
  const idleTimeout = 9000000,
    page1 = document.getElementById("page1");
  const page2 = document.getElementById("page2");
  const idleModal = document.getElementById("idleModal");
  const continueBtn = document.getElementById("continueBtn");
  const countdownEl = document.getElementById("countdown");

  function clearPage2Inputs() {
    document
      .querySelectorAll("#page2 input[data-vnkeys]")
      .forEach((i) => (i.value = ""));
  }

  function showIdleModal() {
    if (page2.classList.contains("d-none") || isModalOpen) return;
    const modal = new bootstrap.Modal(idleModal);
    modal.show();
    isModalOpen = true;
    let count = 5;
    countdownEl.textContent = count;
    const iv = setInterval(() => {
      if (--count <= 0) {
        clearInterval(iv);
        modal.hide();
        page2.classList.add("d-none");
        page1.classList.remove("d-none");
        kbContainer.classList.remove("open");
        activeInput = null;
        isModalOpen = false;
        clearPage2Inputs();
        resetIdleTimer();
      } else countdownEl.textContent = count;
    }, 1000);

    continueBtn.onclick = () => {
      clearInterval(iv);
      modal.hide();
      isModalOpen = false;
      resetIdleTimer();
    };
    idleModal.addEventListener(
      "hidden.bs.modal",
      () => {
        clearInterval(iv);
        isModalOpen = false;
      },
      { once: true }
    );
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (!page2.classList.contains("d-none") && !isModalOpen) {
      idleTimer = setTimeout(showIdleModal, idleTimeout);
    }
  }

  ["mousemove", "click", "keypress"].forEach((evt) =>
    document.addEventListener(evt, () => {
      if (!isModalOpen) resetIdleTimer();
    })
  );
  new MutationObserver(() => {
    if (!page2.classList.contains("d-none")) resetIdleTimer();
    else {
      clearTimeout(idleTimer);
      bootstrap.Modal.getInstance(idleModal)?.hide();
    }
  }).observe(page2, { attributes: true, attributeFilter: ["class"] });

  // --- Xử lý bấm phím ---
  function handleKeyPress(btn) {
    if (!activeInput) return;
    if (btn === "{hide}") {
      kbContainer.classList.remove("open");
      Object.assign(kbContainer.style, {
        visibility: "",
        display: "",
        position: "",
        top: "",
        left: "",
        width: "",
        zIndex: "",
      });
      activeInput = null;
      return;
    }
    // Enter
    if (btn === "{enter}") {
      // Xử lý QR Input
      if (activeInput?.id === "qrInput") {
        const code = activeInput.value.trim();
        if (patients[code]) {
          const p = patients[code];
          document.getElementById("nameInput").value = p.name;
          document.getElementById("ageInput").value = p.age;
          document.getElementById("idInput").value = p.id;
        } else {
          alert("Mã QR không hợp lệ!");
        }
        activeInput.value = "";
        activeInput.focus();
        kbContainer.classList.remove("open");
        Object.assign(kbContainer.style, {
          position: "",
          top: "",
          left: "",
          width: "",
          visibility: "",
          display: "",
          zIndex: "",
        });
        activeInput = null;
        return;
      }

      // Lấy danh sách input & vị trí hiện tại
      const inputs = [...document.querySelectorAll("input[data-vnkeys]")];
      const idx = inputs.indexOf(activeInput);

      // Nếu đang ở input cuối cùng (addressInput)
      if (idx === inputs.length - 1) {
        activeInput.classList.remove("blinking-cursor");
        activeInput.blur();
        kbContainer.classList.remove("open");
        Object.assign(kbContainer.style, {
          position: "",
          top: "",
          left: "",
          width: "",
          visibility: "",
          display: "",
          zIndex: "",
        });
        if (keyboard.clearInput) {
          keyboard.clearInput();
        }
        activeInput = null;
        return;
      }

      // Chuyển focus tới input kế tiếp
      if (idx >= 0 && idx < inputs.length - 1) {
        activeInput.classList.remove("blinking-cursor");
        const inp = inputs[idx + 1];
        inp.focus();
        inp.classList.add("blinking-cursor");
        activeInput = inp;

        // Đồng bộ giá trị với bàn phím
        keyboard.setInput(inp.value);
        if (keyboard.options) {
          keyboard.options.inputName = inp.id;
        }

        // Tính vị trí hiển thị bàn phím
        const r = inp.getBoundingClientRect();
        const p = page2.getBoundingClientRect();
        const m = 8;

        // Đo chiều cao bàn phím
        kbContainer.style.visibility = "hidden";
        kbContainer.classList.add("open");
        const kbHeight = kbContainer.getBoundingClientRect().height;
        kbContainer.classList.remove("open");
        kbContainer.style.visibility = "";

        // Tọa độ top mặc định
        let topPos = r.bottom + m;
        const viewportHeight = window.innerHeight;

        // Điều chỉnh nếu tràn viewport
        if (topPos + kbHeight > viewportHeight) {
          topPos = r.top - m - kbHeight;
          if (topPos < 0) topPos = m;
        } else if (topPos < 0) {
          topPos = m;
        }

        // Cập nhật style và hiển thị
        Object.assign(kbContainer.style, {
          position: "fixed",
          top: `${topPos}px`,
          left: `${p.left}px`,
          width: `${p.width}px`,
          visibility: "visible",
          display: "block",
          zIndex: "9999",
        });
        kbContainer.classList.add("open");

        // Đảm bảo input giữ focus
        setTimeout(() => {
          if (document.activeElement !== inp) {
            inp.focus();
          }
        }, 100);
      }
      return;
    }

    // Các phím khác: Backspace, Space, ký tự
    const start = activeInput.selectionStart,
      end = activeInput.selectionEnd;
    let val = activeInput.value;

    if (btn === "{bksp}") {
      if (start > 0 && start === end) {
        val = val.slice(0, start - 1) + val.slice(end);
        activeInput.setSelectionRange(start - 1, start - 1);
      } else {
        val = val.slice(0, start) + val.slice(end);
        activeInput.setSelectionRange(start, start);
      }
    } else if (btn === "{space}") {
      val = val.slice(0, start) + " " + val.slice(end);
      activeInput.setSelectionRange(start + 1, start + 1);
    } else if (!btn.startsWith("{")) {
      val = val.slice(0, start) + btn + val.slice(end);
      activeInput.setSelectionRange(start + btn.length, start + btn.length);
      activeInput.value = val;
      activeInput.dispatchEvent(new Event("input", { bubbles: true }));
      keyboard.setInput(val);
      activeInput.focus();
      showDiacriticSuggestions(btn);

      if (keyboard.options.layoutName === "shift") {
        keyboard.setOptions({ layoutName: "default" });
        kbContainer.classList.add("open"); // Đảm bảo vẫn hiện
      }

      return;
    } else return;

    clearDiacriticSuggestions();
    activeInput.value = val;
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    keyboard.setInput(val);
    activeInput.focus();
    kbContainer.classList.add("open");
  }

  // --- Gợi ý dấu ---
  function showDiacriticSuggestions(letter) {
    const key = letter.toLowerCase();
    const list = diacriticMap[key] || [];
    const container = document.getElementById("diacritic-suggestions");
    container.innerHTML = "";
    if (!list.length) return;

    list.forEach((ch) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.textContent = ch;
      btn.addEventListener("click", (e) => {
        // 1) Ngăn không cho click này bị coi là "click ngoài"
        e.stopPropagation();

        // 2) Thay ký tự trong input
        const pos = activeInput.selectionStart;
        let v = activeInput.value;
        const newV = v.slice(0, pos - 1) + ch + v.slice(pos);
        activeInput.value = newV;
        activeInput.setSelectionRange(pos, pos);
        activeInput.dispatchEvent(new Event("input", { bubbles: true }));

        // 3) Cập nhật lại simple-keyboard và focus input
        keyboard.setInput(newV);
        activeInput.focus();

        // 4) Giữ keyboard mở
        kbContainer.classList.add("open");

        // 5) Xóa gợi ý
        clearDiacriticSuggestions();
      });
      container.appendChild(btn);
    });
  }

  function clearDiacriticSuggestions() {
    document.getElementById("diacritic-suggestions").innerHTML = "";
  }

  // --- Khi input focus ---
  document.querySelectorAll("input[data-vnkeys]").forEach((inp) => {
    inp.addEventListener("focus", () => {
      // Bỏ đi các blinking cursor cũ
      document
        .querySelectorAll("input[data-vnkeys]")
        .forEach((i) => i.classList.remove("blinking-cursor"));
      inp.classList.add("blinking-cursor");

      activeInput = inp;
      keyboard.setInput(inp.value);

      const r = inp.getBoundingClientRect();
      const p = page2.getBoundingClientRect();
      const m = 8;

      // Đầu tiên hiển thị tạm để đo được chiều cao thật của bàn phím
      kbContainer.style.visibility = "hidden";
      kbContainer.classList.add("open");
      const kbHeight = kbContainer.getBoundingClientRect().height;
      kbContainer.classList.remove("open");
      kbContainer.style.visibility = "";

      // Tính vị trí top mặc định (dưới input)
      let topPos = r.bottom + m;
      // Nếu tràn xuống dưới viewport thì nhảy lên trên input
      if (topPos + kbHeight > window.innerHeight) {
        topPos = r.top - m - kbHeight;
      }

      Object.assign(kbContainer.style, {
        position: "fixed",
        top: `${topPos}px`,
        left: `${p.left}px`,
        width: `${p.width}px`,
      });
      kbContainer.classList.add("open");
    });
  });

  // --- Nút chuyển trang ---
  document.getElementById("registerBtn").addEventListener("click", () => {
    page1.classList.add("d-none");
    page2.classList.remove("d-none");
    clearPage2Inputs();
    // Mặc định focus vào ô QR
    document.getElementById("qrInput").focus();
  });
  document.getElementById("revisitBtn").addEventListener("click", () => {
    page1.classList.add("d-none");
    page2.classList.remove("d-none");
    clearPage2Inputs();
    // Mặc định focus vào ô QR
    document.getElementById("qrInput").focus();
  });

  //-----------------Viết hoa chữ cái đầu mỗi từ cho Họ tên
  const nameInput = document.getElementById("nameInput");
  nameInput.addEventListener("input", (e) => {
    // lưu vị trí con trỏ để không bị nhảy khi set lại value
    const pos = e.target.selectionStart;
    // chuyển toàn bộ về lowercase rồi title-case
    let v = e.target.value
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
    e.target.value = v;
    // đặt lại con trỏ
    e.target.setSelectionRange(pos, pos);
  });
});
