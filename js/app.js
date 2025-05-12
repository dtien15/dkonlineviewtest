document.addEventListener("DOMContentLoaded", () => {
  // load dữ liệu JSON
  let patients = {};
  fetch("./data/patients.json")
    .then((res) => res.json())
    .then((json) => (patients = json))
    .catch(() => alert("Không tải được dữ liệu bệnh nhân."));

  const page1 = document.getElementById("page1");
  const page2 = document.getElementById("page2");
  const formTitle = document.getElementById("formTitle");
  const qrInput = document.getElementById("qrInput");

  // chuyển trang
  document.getElementById("registerBtn").onclick = () => {
    formTitle.textContent = "Đăng ký - Quét mã QR";
    page1.classList.add("hidden");
    page2.classList.remove("hidden");
    qrInput.focus();
  };
  document.getElementById("revisitBtn").onclick = () => {
    formTitle.textContent = "Tái khám - Quét mã QR";
    page1.classList.add("hidden");
    page2.classList.remove("hidden");
    qrInput.focus();
  };

  // xử lý Enter
  qrInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = qrInput.value.trim();
      if (patients[code]) {
        const p = patients[code];
        document.getElementById("nameInput").value = p.name;
        document.getElementById("ageInput").value = p.age;
        document.getElementById("idInput").value = p.patientId;
        document.getElementById("addressInput").value = p.address;
      } else {
        alert("Mã QR không hợp lệ!");
      }
      qrInput.value = "";
      qrInput.focus();
    }
  });
});
