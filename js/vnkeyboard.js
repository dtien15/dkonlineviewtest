document.addEventListener("DOMContentLoaded", () => {
  VNKeys.setMethod("auto");

  // Lấy đúng container
  const kbContainer = document.querySelector(".simple-keyboard");

  // Khởi tạo bàn phím vào đúng container
  const keyboard = new SimpleKeyboard.default({
    rootElement: kbContainer,
    onKeyPress: (btn) => handleKeyPress(btn),
    display: {
      "{enter}": "Xác nhận",
      "{bksp}": "Xóa",
      "{shift}": "Shift",
      "{lock}": "Caps",
      "{space}": " ",
      "{tab}": "Tab",
    },
    layoutName: "default", // Explicitly set default layout
  });

  let activeInput = null;

  // Load dữ liệu JSON
  let patients = {};
  fetch("data/patients.json")
    .then((res) => res.json())
    .then((json) => (patients = json))
    .catch(() => alert("Không tải được dữ liệu bệnh nhân."));

  // Idle detection variables
  let idleTimer = null;
  const idleTimeout = 10000;
  const modalTimeout = 5000;
  const page2 = document.getElementById("page2");
  const page1 = document.getElementById("page1");
  const idleModal = document.getElementById("idleModal");
  const continueBtn = document.getElementById("continueBtn");
  const countdownElement = document.getElementById("countdown");

  // Function to reset idle timer
  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (!page2.classList.contains("d-none")) {
      idleTimer = setTimeout(showIdleModal, idleTimeout);
    }
  }

  // Function to show idle modal and start 5-second countdown
  function showIdleModal() {
    if (!page2.classList.contains("d-none")) {
      const bootstrapModal = new bootstrap.Modal(idleModal);
      bootstrapModal.show();
      let countdown = 5;
      countdownElement.textContent = countdown;

      const countdownInterval = setInterval(() => {
        countdown -= 1;
        countdownElement.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          // Redirect to page1
          page2.classList.add("d-none");
          page1.classList.remove("d-none");
          bootstrapModal.hide();
          kbContainer.classList.remove("open");
          activeInput = null;
        }
      }, 1000);

      // Handle continue button click
      continueBtn.onclick = () => {
        clearInterval(countdownInterval);
        bootstrapModal.hide();
        resetIdleTimer();
      };
    }
  }

  // Reset idle timer on user interaction
  ["mousemove", "click", "keypress"].forEach((event) => {
    document.addEventListener(event, resetIdleTimer);
  });

  // Start idle timer when page2 is shown
  const observer = new MutationObserver(() => {
    if (!page2.classList.contains("d-none")) {
      resetIdleTimer();
    } else {
      if (idleTimer) clearTimeout(idleTimer);
      const bootstrapModal = bootstrap.Modal.getInstance(idleModal);
      if (bootstrapModal) bootstrapModal.hide();
    }
  });
  observer.observe(page2, { attributes: true, attributeFilter: ["class"] });

  function handleKeyPress(btn) {
    if (!activeInput) return;

    // Handle Shift or Caps Lock
    if (btn === "{shift}" || btn === "{lock}") {
      const currentLayout = keyboard.options.layoutName;
      const newLayout = currentLayout === "default" ? "shift" : "default";
      keyboard.setOptions({ layoutName: newLayout });
      kbContainer.classList.add("open");
      activeInput.focus();
      return;
    }

    // Handle Enter
    if (btn === "{enter}") {
      if (activeInput.id === "qrInput") {
        const code = activeInput.value.trim();
        if (patients[code]) {
          const p = patients[code];
          document.getElementById("nameInput").value = p.name;
          document.getElementById("ageInput").value = p.age;
          document.getElementById("idInput").value = p.patientId;
          document.getElementById("addressInput").value = p.address;
        } else {
          alert("Mã QR không hợp lệ!");
        }
        activeInput.value = "";
        activeInput.focus();
        kbContainer.classList.remove("open");
        activeInput = null;
        return;
      }

      const inputs = Array.from(
        document.querySelectorAll("input[data-vnkeys]")
      );
      const idx = inputs.indexOf(activeInput);
      if (idx !== -1 && idx < inputs.length - 1) {
        // Remove blinking effect from current input
        activeInput.classList.remove("blinking-cursor");

        // Move focus to next input
        const nextInput = inputs[idx + 1];
        nextInput.focus();

        // Add blinking effect to next input
        nextInput.classList.add("blinking-cursor");

        // Update keyboard position for the new input
        const inputRect = nextInput.getBoundingClientRect();
        const page2Rect = page2.getBoundingClientRect();
        const margin = 8;
        kbContainer.style.top = `${inputRect.bottom + margin}px`;
        kbContainer.style.left = `${page2Rect.left}px`;
        kbContainer.style.width = `${page2Rect.width}px`;
        kbContainer.classList.add("open");

        // Update activeInput and keyboard input
        activeInput = nextInput;
        keyboard.setInput(nextInput.value);
      } else {
        activeInput.classList.remove("blinking-cursor");
        activeInput.blur();
        kbContainer.classList.remove("open");
        activeInput = null;
      }
      return;
    }

    // Handle other keys: Backspace, Space, or Characters
    const start = activeInput.selectionStart;
    const end = activeInput.selectionEnd;
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
    } else {
      return;
    }

    activeInput.value = val;
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    activeInput.focus();
    keyboard.setInput(val);
    kbContainer.classList.add("open");
  }

  // Show keyboard when input is focused
  document.querySelectorAll("input[data-vnkeys]").forEach((inp) => {
    inp.addEventListener("focus", () => {
      // Remove blinking effect from all inputs
      document.querySelectorAll("input[data-vnkeys]").forEach((input) => {
        input.classList.remove("blinking-cursor");
      });

      // Add blinking effect to the focused input
      inp.classList.add("blinking-cursor");

      activeInput = inp;
      keyboard.setInput(inp.value);

      const inputRect = inp.getBoundingClientRect();
      const page2Rect = page2.getBoundingClientRect();
      const margin = 8;

      kbContainer.style.position = "fixed";
      kbContainer.style.top = `${inputRect.bottom + margin}px`;
      kbContainer.style.left = `${page2Rect.left}px`;
      kbContainer.style.width = `${page2Rect.width}px`;
      kbContainer.classList.add("open");
    });
  });

  // Hide keyboard when clicking outside input or keyboard
  document.addEventListener("click", (e) => {
    const isKeyboardKey = e.target.closest(".hg-button");
    if (
      !e.target.closest(".simple-keyboard") &&
      !e.target.matches("input[data-vnkeys]") &&
      !isKeyboardKey &&
      !e.target.matches("#continueBtn") // Ignore clicks on continue button
    ) {
      kbContainer.classList.remove("open");
      document.querySelectorAll("input[data-vnkeys]").forEach((input) => {
        input.classList.remove("blinking-cursor");
      });
      activeInput = null;
    }
  });

  // Handle page navigation
  document.getElementById("registerBtn").addEventListener("click", () => {
    page1.classList.add("d-none");
    page2.classList.remove("d-none");
  });

  document.getElementById("revisitBtn").addEventListener("click", () => {
    page1.classList.add("d-none");
    page2.classList.remove("d-none");
  });
});
