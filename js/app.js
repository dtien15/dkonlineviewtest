document.addEventListener("DOMContentLoaded", () => {
  // 1. Load dữ liệu JSON
  let patients = {};
  fetch("./data/patients.json")
    .then((res) => res.json())
    .then((json) => {
      patients = json;
    })
    .catch(() => alert("Không tải được dữ liệu bệnh nhân."));

  // 2. Lấy các phần tử cần dùng
  const page1 = document.getElementById("page1");
  const page2 = document.getElementById("page2");
  const formTitle = document.getElementById("formTitle");
  const qrInput = document.getElementById("qrInput");

  // 3. Hàm chuyển về page2 và focus QR
  function showPage2(modeText) {
    formTitle.textContent = `${modeText} - Quét mã QR`;
    page1.classList.add("d-none");
    page2.classList.remove("d-none");
    qrInput.value = "";
    qrInput.focus();
  }

  // 4. Chuyển trang khi bấm nút
  document.getElementById("registerBtn").onclick = () => showPage2("Đăng ký");
  document.getElementById("revisitBtn").onclick = () => showPage2("Tái khám");

  // 5. Xử lý Enter trên ô QR
  qrInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = qrInput.value.trim();
      if (patients[code]) {
        const p = patients[code];
        document.getElementById("nameInput").value = p.name || "";
        document.getElementById("ageInput").value = p.age || "";
        document.getElementById("idInput").value = p.patientId || "";
        document.getElementById("addressInput").value = p.address || "";
      } else {
        alert("Mã QR không hợp lệ!");
      }
      qrInput.value = "";
      qrInput.focus();
    }
  });

  // --- Viết hoa chữ cái đầu mỗi từ cho Họ tên ---
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
