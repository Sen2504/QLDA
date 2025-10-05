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
  MDBBreadcrumb,
  MDBBreadcrumbItem,
} from "mdb-react-ui-kit";
import UserService from "../services/userService";
import MainLayout from "../layouts/MainLayout";


export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    UserService.getProfile()
      .then((res) => setUser(res.data))
      .catch((err) => console.error("Error loading profile", err));
  }, []);

  if (!user) return <p className="p-5 text-center">Đang tải...</p>;

  return (
    <MainLayout>
      <section>
        <MDBContainer className="py-5">
          <MDBRow>
            {/* Avatar + Info */}
            <MDBCol lg="4">
              <MDBCard className="mb-4">
                <MDBCardBody className="text-center">
                  <MDBCardImage
                    src={user.avatar ? `${API_BASE}${user.avatar}` : "/default-avatar.png"}
                    alt="avatar"
                    className="rounded-circle"
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
                  <div className="d-flex justify-content-center mb-2">
                    <MDBBtn>Edit</MDBBtn>
                  </div>
                </MDBCardBody>
              </MDBCard>
            </MDBCol>

            {/* Chi tiết */}
            <MDBCol lg="8">
              <MDBCard className="mb-4">
                <MDBCardBody>
                  <MDBRow>
                    <MDBCol sm="3">
                      <MDBCardText>Full Name</MDBCardText>
                    </MDBCol>
                    <MDBCol sm="9">
                      <MDBCardText className="text-muted">{user.name}</MDBCardText>
                    </MDBCol>
                  </MDBRow>
                  <hr />

                  <MDBRow>
                    <MDBCol sm="3">
                      <MDBCardText>Email</MDBCardText>
                    </MDBCol>
                    <MDBCol sm="9">
                      <MDBCardText className="text-muted">{user.email}</MDBCardText>
                    </MDBCol>
                  </MDBRow>
                  <hr />

                  <MDBRow>
                    <MDBCol sm="3">
                      <MDBCardText>Skillset</MDBCardText>
                    </MDBCol>
                    <MDBCol sm="9">
                      <MDBCardText className="text-muted">{user.skillset}</MDBCardText>
                    </MDBCol>
                  </MDBRow>
                  <hr />
                  <MDBRow>
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
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
          </MDBRow>
        </MDBContainer>
      </section>
    </MainLayout>
  );
}
