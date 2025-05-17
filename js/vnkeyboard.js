document.addEventListener("DOMContentLoaded", () => {
  // --- Khởi tạo VNKeys + simple-keyboard ---
  VNKeys.setMethod("auto");
  const kbContainer = document.querySelector(".simple-keyboard");
  // Giữ keyboard mở khi click chuột
  kbContainer.addEventListener("mousedown", (e) => {
    e.preventDefault(); // ngăn blur/focus
    e.stopPropagation();
  });

  // Giữ keyboard mở khi tap trên màn hình cảm ứng
  kbContainer.addEventListener("touchstart", (e) => {
    // chỉ ngăn propagation để touch không coi là click ngoài
    e.stopPropagation();
  });

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
      "{hide}": "Ẩn bàn phím", // custom button
    },
    layout: {
      default: [
        "` 1 2 3 4 5 6 7 8 9 0 - {bksp}",
        "q w e r t y u i o p [ ] \\",
        "a s d f g h j k l ; {enter}",
        "{shift} z x c v b n m , . / {hide}", // chèn nút ở hàng cuối
        "@ {space} .com",
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

      // xóa hiệu ứng
      document
        .querySelectorAll("input[data-vnkeys]")
        .forEach((i) => i.classList.remove("blinking-cursor"));
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
          position: "",
          bottom: 0,
          left: `${p.left}px`,
          width: `${p.width}px`,
          visibility: "visible",
          display: "block",
          zIndex: "",
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
    const start = activeInput.selectionStart;
    const end = activeInput.selectionEnd;
    let val = activeInput.value;

    // --- Xử lý Backspace ---
    if (btn === "{bksp}") {
      let newPos;
      // Xóa một ký tự trước con trỏ hoặc vùng chọn
      if (start > 0 && start === end) {
        val = val.slice(0, start - 1) + val.slice(end);
        newPos = start - 1;
      } else {
        val = val.slice(0, start) + val.slice(end);
        newPos = start;
      }

      // 1) Cập nhật giá trị
      activeInput.value = val;
      // 2) Gọi event input
      activeInput.dispatchEvent(new Event("input", { bubbles: true }));
      // 3) Đồng bộ với SimpleKeyboard
      keyboard.setInput(val);
      // 4) Restore focus + caret sau cùng
      setTimeout(() => {
        activeInput.focus();
        activeInput.setSelectionRange(newPos, newPos);
      }, 0);

      kbContainer.classList.add("open");
      return;
    }

    // --- Xử lý Phím cách ---
    if (btn === "{space}") {
      // 1) Tính value mới và vị trí mới
      val = val.slice(0, start) + " " + val.slice(end);
      const newPos = start + 1;

      // 2) Cập nhật giá trị & event
      activeInput.value = val;
      activeInput.dispatchEvent(new Event("input", { bubbles: true }));
      // 3) Đồng bộ keyboard
      keyboard.setInput(val);
      // 4) Restore caret
      setTimeout(() => {
        activeInput.focus();
        activeInput.setSelectionRange(newPos, newPos);
      }, 0);

      kbContainer.classList.add("open");
      return;
    }

    // --- Xử lý ký tự thường (chữ, số, dấu) ---
    if (!btn.startsWith("{")) {
      const newVal = val.slice(0, start) + btn + val.slice(end);
      const newPos = start + btn.length;

      activeInput.value = newVal;
      activeInput.dispatchEvent(new Event("input", { bubbles: true }));
      keyboard.setInput(newVal);

      setTimeout(() => {
        activeInput.focus();
        activeInput.setSelectionRange(newPos, newPos);
      }, 0);

      showDiacriticSuggestions(btn);

      if (keyboard.options.layoutName === "shift") {
        keyboard.setOptions({ layoutName: "default" });
        kbContainer.classList.add("open");
      }

      // --- Mở lại đúng dropdown dựa trên class ---
      if (activeInput.classList.contains("choices__input--cloned")) {
        if (activeInput.classList.contains("service-input")) {
          if (!serviceChoices.dropdown.isActive) {
            serviceChoices.showDropdown();
          }
        } else if (activeInput.classList.contains("gender-input")) {
          if (!genderChoices.dropdown.isActive) {
            genderChoices.showDropdown();
          }
        }
      }

      return;
    }

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
        position: "",
        bottom: 0,
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

  //------------- Chặn sự kiện zoom màn hình
  const fsBtn = document.getElementById("fullscreenBtn");

  fsBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      // Yêu cầu vào chế độ toàn màn hình
      document.documentElement
        .requestFullscreen?.()
        .catch((err) =>
          console.error(`Không thể bật toàn màn hình: ${err.message}`)
        );
    } else {
      // Thoát chế độ toàn màn hình
      document
        .exitFullscreen?.()
        .catch((err) =>
          console.error(`Không thể thoát toàn màn hình: ${err.message}`)
        );
    }
  });

  //------------- Hiển thị khi có ban phím
  const heading = document.querySelector(".text-wrap >  h2.text-heading");

  const observer = new MutationObserver(() => {
    const isOpen = kbContainer.classList.contains("open");
    document.body.classList.toggle("keyboard-open", isOpen);
    heading.style.display = isOpen ? "none" : "";
  });

  observer.observe(kbContainer, {
    attributes: true,
    attributeFilter: ["class"],
  });

  //-----------Select
  function clearIdentifierClasses() {
    document
      .querySelectorAll(".service-input, .gender-input")
      .forEach((i) => i.classList.remove("service-input", "gender-input"));
  }

  // --- serviceSelect ---
  const serviceEl = document.getElementById("serviceSelect");
  const serviceChoices = new Choices(serviceEl, {
    searchEnabled: true,
    placeholderValue: "--- Chọn dịch vụ ---",
    searchPlaceholderValue: "--- Gõ để tìm ---",
    shouldCloseOnSelect: false,
    position: "top",
  });

  // Khi mở service dropdown
  serviceEl.addEventListener("showDropdown", () => {
    clearIdentifierClasses();
    const wrapper = serviceEl.closest(".choices");
    const inp = wrapper.querySelector(".choices__input--cloned");
    if (!inp) return;
    inp.classList.add("service-input");
    inp.setAttribute("data-vnkeys", "");
    activeInput = inp;
    keyboard.setInput(inp.value);
    inp.focus();

    // … vị trí keyboard …
    const rect = document.getElementById("page2").getBoundingClientRect();
    Object.assign(kbContainer.style, {
      position: "fixed",
      bottom: "0px",
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      visibility: "visible",
      display: "block",
    });
    kbContainer.classList.add("open");
  });

  // Khi đóng service dropdown
  serviceEl.addEventListener("hideDropdown", clearIdentifierClasses);

  // --- genderSelect ---
  const genderEl = document.getElementById("genderSelect");
  const genderChoices = new Choices(genderEl, {
    searchEnabled: true,
    placeholderValue: "--- Chọn giới tính ---",
    searchPlaceholderValue: "--- Gõ để tìm ---",
    shouldCloseOnSelect: false,
    position: "top",
  });

  // Khi mở gender dropdown
  genderEl.addEventListener("showDropdown", () => {
    clearIdentifierClasses();
    const wrapper = genderEl.closest(".choices");
    const inp = wrapper.querySelector(".choices__input--cloned");
    if (!inp) return;
    inp.classList.add("gender-input");
    inp.setAttribute("data-vnkeys", "");
    activeInput = inp;
    keyboard.setInput(inp.value);
    inp.focus();

    // … vị trí keyboard …
    const rect = document.getElementById("page2").getBoundingClientRect();
    Object.assign(kbContainer.style, {
      position: "fixed",
      bottom: "0px",
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      visibility: "visible",
      display: "block",
    });
    kbContainer.classList.add("open");
  });

  // Khi đóng gender dropdown
  genderEl.addEventListener("hideDropdown", clearIdentifierClasses);

  // --- Giữ dropdown khi click keyboard ---
  kbContainer.addEventListener("click", (event) => {
    event.stopPropagation();
    if (activeInput) activeInput.focus();
  });
  //--------------------Ô input
  const input = document.getElementById("dateInput");

  // 1) Hàm format
  function formatFn(date) {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  // 2) Khởi tạo picker
  const picker = TinyDatePicker("#dateInput", {
    format: formatFn,
    parse(str) {
      const [d, m, y] = str.split("/").map(Number);
      return new Date(y, m - 1, d);
    },
    lang: {
      months: [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
      ],
      weekdays: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
    },
    navTitles: {
      days: (d) =>
        `${
          [
            "Tháng 1",
            "Tháng 2",
            "Tháng 3",
            "Tháng 4",
            "Tháng 5",
            "Tháng 6",
            "Tháng 7",
            "Tháng 8",
            "Tháng 9",
            "Tháng 10",
            "Tháng 11",
            "Tháng 12",
          ][d.getMonth()]
        } ${d.getFullYear()}`,
    },
    date: new Date(),
    openOn: "focus",
  });

  // 3) Biến cờ chỉ chạy highlight lần đầu
  let firstRun = true;

  function highlightTodayOnce() {
    if (!firstRun) return; // chỉ chạy lần đầu
    firstRun = false;

    const today = new Date();
    // (a) reset input
    input.value = formatFn(today);

    // (b) thao tác trên popup
    const root = document.querySelector(".tdp");
    if (!root) return;

    root
      .querySelectorAll(".tdp__day--selected")
      .forEach((el) => el.classList.remove("tdp__day--selected"));

    root.querySelectorAll(".tdp__days li").forEach((li) => {
      if (+li.textContent === today.getDate()) {
        li.classList.add("tdp__day--selected");
      }
    });
  }

  // 4) Chạy ngay sau init
  highlightTodayOnce();

  // 5) Hook vào open để if firstRun thì highlight
  picker.on("open", highlightTodayOnce);

  // 6) Khi user chọn ngày, input.value đã được set, và
  //    vì firstRun=false thì không còn ép về hôm nay nữa
  picker.on("date", ({ date }) => {
    console.log("User chọn:", formatFn(date));
  });
});
