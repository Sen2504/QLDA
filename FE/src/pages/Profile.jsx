import React, { useEffect, useState } from "react";
import {
  MDBCol,
  MDBContainer,
  MDBRow,
  MDBCard,
  MDBCardText,
  MDBCardBody,
  MDBCardImage,
  MDBBtn,
} from "mdb-react-ui-kit";
import UserService from "../services/userService";
import MainLayout from "../layouts/MainLayout";
import PopupMessage from "../components/Popup_message"; // ✅ sử dụng popup custom

const API_BASE = "http://localhost:5000";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", skillset: "" });
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ✅ popup state
  const [popup, setPopup] = useState({ show: false, message: "", type: "success" });

  const showPopup = (message, type = "success") => {
    setPopup({ show: true, message, type });
    setTimeout(() => {
      setPopup({ show: false, message: "", type: "success" });
    }, 2500);
  };

  useEffect(() => {
    UserService.getProfile()
      .then((res) => {
        setUser(res.data);
        setFormData({
          name: res.data.name || "",
          skillset: res.data.skillset || "",
        });
      })
      .catch(() => showPopup("Lỗi khi tải thông tin người dùng", "error"));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      // Nếu có nhập mật khẩu thì đổi trước
      if (passwords.oldPassword || passwords.newPassword || passwords.confirmPassword) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          showPopup("Xác nhận mật khẩu không khớp!", "error");
          return;
        }

        await UserService.changePassword(passwords);
        showPopup("Đổi mật khẩu thành công!", "success");
      }

      // Sau khi đổi mật khẩu (nếu có), mới cập nhật thông tin
      await UserService.updateProfile(formData);
      setUser({ ...user, ...formData });
      showPopup("Cập nhật thông tin thành công!", "success");

      // Reset form & thoát edit
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setEditMode(false);
    } catch (err) {
      const errMsg = err.response?.data?.error || "Có lỗi xảy ra khi lưu thay đổi.";
      showPopup(errMsg, "error");
    }
  };

  if (!user) return <p className="p-5 text-center">Đang tải...</p>;

  return (
    <MainLayout>
      {popup.show && (
        <PopupMessage
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ show: false, message: "", type: "success" })}
        />
      )}

      <section>
        <MDBContainer className="py-5">
          <MDBRow>
            {/* Cột trái: Avatar + Info */}
            <MDBCol lg="4">
              <MDBCard className="mb-4 text-center">
                <MDBCardBody>
                  <MDBCardImage
                    src={(() => {
                      if (user.avatar) return `${API_BASE}${user.avatar}`;
                      if (user.email) {
                        const folderName = user.email
                          .replace("@", "_at_")
                          .replace(/\./g, "_");
                        return `${API_BASE}/uploads/avatars/${folderName}/`;
                      }
                      return "/default-avatar.png";
                    })()}
                    alt="avatar"
                    className="rounded-circle d-block mx-auto mb-3"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                    fluid
                  />
                  <h5 className="my-3">{user.name}</h5>
                  <p className="text-muted mb-1">{user.email}</p>
                  <p className="text-muted mb-4">
                    Tạo ngày:{" "}
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </MDBCardBody>
              </MDBCard>
            </MDBCol>

            {/* Cột phải: Thông tin chi tiết */}
            <MDBCol lg="8">
              <MDBCard className="mb-4">
                <MDBCardBody>
                  {/* Full Name */}
                  <MDBRow className="align-items-center mb-3">
                    <MDBCol sm="3">
                      <MDBCardText>Full Name</MDBCardText>
                    </MDBCol>
                    <MDBCol sm="9">
                      {editMode ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="form-control"
                        />
                      ) : (
                        <MDBCardText className="text-muted">{user.name}</MDBCardText>
                      )}
                    </MDBCol>
                  </MDBRow>

                  {/* Email */}
                  <MDBRow className="align-items-center mb-3">
                    <MDBCol sm="3">
                      <MDBCardText>Email</MDBCardText>
                    </MDBCol>
                    <MDBCol sm="9">
                      <MDBCardText className="text-muted">{user.email}</MDBCardText>
                    </MDBCol>
                  </MDBRow>

                  {/* Skillset */}
                  <MDBRow className="align-items-center mb-3">
                    <MDBCol sm="3">
                      <MDBCardText>Skillset</MDBCardText>
                    </MDBCol>
                    <MDBCol sm="9">
                      {editMode ? (
                        <textarea
                          name="skillset"
                          value={formData.skillset}
                          onChange={handleChange}
                          className="form-control"
                          rows="2"
                        />
                      ) : (
                        <MDBCardText className="text-muted">
                          {user.skillset || "-"}
                        </MDBCardText>
                      )}
                    </MDBCol>
                  </MDBRow>

                  {/* Confirmed At */}
                  <MDBRow className="align-items-center mb-3">
                    <MDBCol sm="3">
                      <MDBCardText>Confirmed At</MDBCardText>
                    </MDBCol>
                    <MDBCol sm="9">
                      <MDBCardText className="text-muted">
                        {user.confirmed_at
                          ? new Date(user.confirmed_at).toLocaleString("vi-VN")
                          : "-"}
                      </MDBCardText>
                    </MDBCol>
                  </MDBRow>

                  {/* ========== PASSWORD SECTION ========== */}
                  {editMode && (
                    <>
                      <hr />
                      <h6 className="fw-bold mb-3 mt-4">Đổi mật khẩu</h6>

                      <MDBRow className="mb-3">
                        <MDBCol sm="4">
                          <MDBCardText>Mật khẩu hiện tại</MDBCardText>
                        </MDBCol>
                        <MDBCol sm="8">
                          <input
                            type="password"
                            name="oldPassword"
                            value={passwords.oldPassword}
                            onChange={handlePasswordChange}
                            className="form-control"
                          />
                        </MDBCol>
                      </MDBRow>

                      <MDBRow className="mb-3">
                        <MDBCol sm="4">
                          <MDBCardText>Mật khẩu mới</MDBCardText>
                        </MDBCol>
                        <MDBCol sm="8">
                          <input
                            type="password"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handlePasswordChange}
                            className="form-control"
                          />
                        </MDBCol>
                      </MDBRow>

                      <MDBRow className="mb-4">
                        <MDBCol sm="4">
                          <MDBCardText>Xác nhận mật khẩu mới</MDBCardText>
                        </MDBCol>
                        <MDBCol sm="8">
                          <input
                            type="password"
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handlePasswordChange}
                            className="form-control"
                          />
                        </MDBCol>
                      </MDBRow>

                      {/* Save / Cancel */}
                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <MDBBtn color="success" onClick={handleSave}>
                          Save
                        </MDBBtn>
                        <MDBBtn
                          color="secondary"
                          onClick={() => {
                            setEditMode(false);
                            setPasswords({
                              oldPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                          }}
                        >
                          Cancel
                        </MDBBtn>
                      </div>
                    </>
                  )}

                  {!editMode && (
                    <div className="d-flex justify-content-end mt-3">
                      <MDBBtn onClick={() => setEditMode(true)}>Edit</MDBBtn>
                    </div>
                  )}
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
          </MDBRow>
        </MDBContainer>
      </section>
    </MainLayout>
  );
}
