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
import PopupMessage from "../components/Popup_message";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import CreatableSelect from "react-select/creatable";


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
  const [passwordMatchError, setPasswordMatchError] = useState(""); // lỗi khi confirm sai

  const [showPass, setShowPass] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const skillOptions = [
  { value: "JavaScript", label: "JavaScript" },
  { value: "TypeScript", label: "TypeScript" },
  { value: "React", label: "React" },
  { value: "Next.js", label: "Next.js" },
  { value: "Node.js", label: "Node.js" },
  { value: "Express.js", label: "Express.js" },
  { value: "Python", label: "Python" },
  { value: "Flask", label: "Flask" },
  { value: "Django", label: "Django" },
  { value: "Java", label: "Java" },
  { value: "Spring Boot", label: "Spring Boot" },
  { value: "C#", label: "C#" },
  { value: ".NET", label: ".NET" },
  { value: "PHP", label: "PHP" },
  { value: "Laravel", label: "Laravel" },
  { value: "MySQL", label: "MySQL" },
  { value: "PostgreSQL", label: "PostgreSQL" },
  { value: "MongoDB", label: "MongoDB" },
  { value: "Docker", label: "Docker" },
  { value: "Kubernetes", label: "Kubernetes" },
];

  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: "success",
  });

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
      .catch(() => showPopup("Error loading user information", "error"));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));

    // 👇 Check trùng mật khẩu ngay khi nhập
    if (
      (name === "newPassword" || name === "confirmPassword") &&
      passwords.newPassword !== passwords.confirmPassword
    ) {
      if (
        name === "newPassword" &&
        value === passwords.confirmPassword &&
        passwords.confirmPassword !== ""
      ) {
        setPasswordMatchError("");
      } else if (
        name === "confirmPassword" &&
        value === passwords.newPassword &&
        passwords.newPassword !== ""
      ) {
        setPasswordMatchError("");
      } else {
        setPasswordMatchError("New password and confirmation do not match!");
      }
    } else {
      setPasswordMatchError("");
    }
  };

  const handleSave = async () => {
    if (passwordMatchError) {
      showPopup("Please check your password again to confirm!", "error");
      return;
    }

    try {
      if (
        passwords.oldPassword ||
        passwords.newPassword ||
        passwords.confirmPassword
      ) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          showPopup("Confirm passwords do not match!", "error");
          return;
        }

        await UserService.changePassword(passwords);
        showPopup("Password changed successfully!", "success");
      }

      await UserService.updateProfile(formData);
      setUser({ ...user, ...formData });
      showPopup("Updated information successfully!", "success");

      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setEditMode(false);
    } catch (err) {
      const errMsg =
        err.response?.data?.error || "An error occurred while saving changes.";
      showPopup(errMsg, "error");
    }
  };

  if (!user) return <p className="p-5 text-center">Loading...</p>;

  return (
    <>
      {popup.show && (
        <PopupMessage
          message={popup.message}
          type={popup.type}
          onClose={() =>
            setPopup({ show: false, message: "", type: "success" })
          }
        />
      )}

      <section>
        <MDBContainer className="py-5">
          <MDBRow>
            {/* Cột trái: Avatar + Info */}
            <MDBCol lg="4">
              <MDBCard className="mb-4 text-center">
                <MDBCardBody className="text-center">
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
                  <p className="text-muted mb-2">
                    Created at:{" "}
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                  <div className="text-center mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="avatarInput"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        try {
                          const res = await UserService.uploadAvatar(file);
                          setUser((prev) => ({ ...prev, avatar: res.data.avatar }));
                          showPopup("Updated avatar successfully!", "success");
                        } catch (err) {
                          showPopup(
                            err.response?.data?.error || "Error uploading avatar.",
                            "error"
                          );
                        }
                      }}
                      className="d-none"
                    />
                    <label
                      htmlFor="avatarInput"
                      className="btn btn-sm btn-outline-primary mt-2"
                      style={{ cursor: "pointer" }}
                    >
                      Upload Avatar
                    </label>
                  </div>
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
                        <MDBCardText className="text-muted">
                          {user.name}
                        </MDBCardText>
                      )}
                    </MDBCol>
                  </MDBRow>

                  {/* Email */}
                  <MDBRow className="align-items-center mb-3">
                    <MDBCol sm="3">
                      <MDBCardText>Email</MDBCardText>
                    </MDBCol>
                    <MDBCol sm="9">
                      <MDBCardText className="text-muted">
                        {user.email}
                      </MDBCardText>
                    </MDBCol>
                  </MDBRow>

                  {/* Skillset */}
                  <MDBRow className="align-items-center mb-3">
                    <MDBCol sm="3">
                      <MDBCardText>Skillset</MDBCardText>
                    </MDBCol>
                    <MDBCol sm="9">
                      {editMode ? (
                      <CreatableSelect
                        isMulti
                        options={skillOptions}
                        value={
                          formData.skillset
                            ? formData.skillset.split(",").map((s) => ({ value: s, label: s }))
                            : []
                        }
                        onChange={(selected) => {
                          const newSkills = selected.map((s) => s.value).join(",");
                          setFormData((prev) => ({ ...prev, skillset: newSkills }));
                        }}
                        placeholder="Enter or select a skill..."
                        classNamePrefix="select"
                      />
                    ) : (
                      <MDBCardText className="text-muted">
                        {user.skillset
                          ? user.skillset.split(",").join(", ")
                          : "-"}
                      </MDBCardText>
                    )}
                    </MDBCol>
                  </MDBRow>

                  {/* ========== PASSWORD SECTION ========== */}
                  {editMode && (
                    <>
                      <hr />
                      <h6 className="fw-bold mb-3 mt-4">Change password</h6>

                      {/* old password */}
                      <MDBRow className="mb-3 align-items-center">
                        <MDBCol sm="4">
                          <MDBCardText>Current password</MDBCardText>
                        </MDBCol>
                        <MDBCol sm="8">
                          <div className="position-relative">
                            <input
                              type={showPass.old ? "text" : "password"}
                              name="oldPassword"
                              value={passwords.oldPassword}
                              onChange={handlePasswordChange}
                              className="form-control pe-5"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPass((prev) => ({
                                  ...prev,
                                  old: !prev.old,
                                }))
                              }
                              className="position-absolute end-0 top-50 translate-middle-y me-2 border-0 bg-transparent text-muted"
                            >
                              {showPass.old ? (
                                <EyeOffIcon size={18} />
                              ) : (
                                <EyeIcon size={18} />
                              )}
                            </button>
                          </div>
                        </MDBCol>
                      </MDBRow>

                      {/* new password */}
                      <MDBRow className="mb-3 align-items-center">
                        <MDBCol sm="4">
                          <MDBCardText>New password</MDBCardText>
                        </MDBCol>
                        <MDBCol sm="8">
                          <div className="position-relative">
                            <input
                              type={showPass.new ? "text" : "password"}
                              name="newPassword"
                              value={passwords.newPassword}
                              onChange={handlePasswordChange}
                              className="form-control pe-5"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPass((prev) => ({
                                  ...prev,
                                  new: !prev.new,
                                }))
                              }
                              className="position-absolute end-0 top-50 translate-middle-y me-2 border-0 bg-transparent text-muted"
                            >
                              {showPass.new ? (
                                <EyeOffIcon size={18} />
                              ) : (
                                <EyeIcon size={18} />
                              )}
                            </button>
                          </div>
                        </MDBCol>
                      </MDBRow>

                      {/* confirm password */}
                      <MDBRow className="mb-4 align-items-center">
                        <MDBCol sm="4">
                          <MDBCardText>Confirm new password</MDBCardText>
                        </MDBCol>
                        <MDBCol sm="8">
                          <div className="position-relative">
                            <input
                              type={showPass.confirm ? "text" : "password"}
                              name="confirmPassword"
                              value={passwords.confirmPassword}
                              onChange={handlePasswordChange}
                              className="form-control pe-5"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPass((prev) => ({
                                  ...prev,
                                  confirm: !prev.confirm,
                                }))
                              }
                              className="position-absolute end-0 top-50 translate-middle-y me-2 border-0 bg-transparent text-muted"
                            >
                              {showPass.confirm ? (
                                <EyeOffIcon size={18} />
                              ) : (
                                <EyeIcon size={18} />
                              )}
                            </button>
                          </div>

                          {/* Thông báo lỗi trùng mật khẩu */}
                          {passwordMatchError && (
                            <small className="text-danger mt-1 d-block">
                              {passwordMatchError}
                            </small>
                          )}
                        </MDBCol>
                      </MDBRow>

                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <MDBBtn
                          color="success"
                          onClick={handleSave}
                          disabled={Boolean(passwordMatchError)} // disable khi lỗi
                        >
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
                            setShowPass({ old: false, new: false, confirm: false });
                            setPasswordMatchError("");
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
    </>
  );
}
