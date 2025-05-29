"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { ThreeDots } from "react-loader-spinner"
import { X, User2, Camera, Save, Shield } from 'lucide-react'
import BACKENDURL from "./urls"

const ProfileModal = ({ 
  isOpen, 
  onClose, 
  userData, 
  user, 
  onUserUpdate 
}) => {
  // Profile Modal States
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isChangePasswordPopupOpened, setIsChangePasswordPopupOpened] = useState(false)
  const [isDataChanged, setIsDataChanged] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", variant: "" })
  const fileInputRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  // Profile data states
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    profilePic: "",
  })
  const [savedProfileData, setSavedProfileData] = useState({
    name: "",
    email: "",
    profilePic: "",
  })
  const [imagePreview, setImagePreview] = useState(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Initialize profile data when user data changes
  useEffect(() => {
    if (userData && user && isOpen) {
      const initialData = {
        name: user.name || userData.name || "",
        email: user.email || userData.email || "",
        profilePic: user.profile || userData.profilePic || "",
      }
      setProfileData(initialData)
      setSavedProfileData(initialData)
      setImagePreview(initialData.profilePic || null)
      setIsDataChanged(false)
      setAlertInfo({ show: false, message: "", variant: "" })
    }
  }, [userData, user, isOpen])

  // Close profile modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        !event.target.closest(".profile-modal-content") &&
        !event.target.closest("[data-profile-toggle]")
      ) {
        if (isMobile) {
          // On mobile, only close if clicking on overlay
          if (event.target.classList.contains("profile-modal-overlay")) {
            handleCloseProfileModal()
          }
        } else {
          handleCloseProfileModal()
        }
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      if (isMobile) {
        document.body.style.overflow = "hidden"
      }
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
      if (isMobile) {
        document.body.style.overflow = "unset"
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      if (isMobile) {
        document.body.style.overflow = "unset"
      }
    }
  }, [isOpen, isMobile])

  const handleCloseProfileModal = () => {
    if (isDataChanged) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose()
        setIsDataChanged(false)
        setAlertInfo({ show: false, message: "", variant: "" })
        setIsChangePasswordPopupOpened(false)
      }
    } else {
      onClose()
      setAlertInfo({ show: false, message: "", variant: "" })
      setIsChangePasswordPopupOpened(false)
    }
  }

  const handleProfileInputChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value })
    setIsDataChanged(true)
  }

  const handleChangePassword = () => setIsChangePasswordPopupOpened(true)

  const handlePasswordSave = async () => {
    if (newPassword !== confirmPassword) {
      setAlertInfo({
        show: true,
        message: "New password and confirm password do not match",
        variant: "danger",
      })
      return
    }
    if (newPassword) {
      await handleProfileSave(true)
      setIsChangePasswordPopupOpened(false)
      setNewPassword("")
      setConfirmPassword("")
      setCurrentPassword("")
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)

    if (file.size > 5 * 1024 * 1024) {
      setAlertInfo({
        show: true,
        message: "Image size should not exceed 5MB",
        variant: "danger",
      })
      setUploadingImage(false)
      return
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setAlertInfo({
        show: true,
        message: "Only JPG, PNG, GIF, and WEBP formats are supported",
        variant: "danger",
      })
      setUploadingImage(false)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target.result
      setImagePreview(base64String)
      handleProfileInputChange("profilePic", base64String)
      setUploadingImage(false)
      setIsDataChanged(true)
    }
    reader.onerror = () => {
      setAlertInfo({
        show: true,
        message: "Error reading file",
        variant: "danger",
      })
      setUploadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  const handleProfileSave = async (isPasswordChange = false) => {
    try {
      setIsProfileLoading(true)
      const saveData = {
        userId: userData.userId,
        name: profileData.name,
        email: profileData.email,
      }

      if (isPasswordChange) {
        saveData.password = newPassword
      } else if (profileData.profilePic !== savedProfileData.profilePic) {
        saveData.profilePic = profileData.profilePic
      }

      const response = await axios.post(`${BACKENDURL}/updateUser`, saveData, { userId: userData.userId })

      setAlertInfo({
        show: true,
        message: isPasswordChange ? "Password updated successfully" : "Profile data saved successfully",
        variant: "success",
      })

      setTimeout(() => {
        setAlertInfo({ show: false, message: "", variant: "" })
      }, 3000)

      if (!isPasswordChange) {
        setIsDataChanged(false)
        setSavedProfileData({ ...profileData })

        // Call the parent update function to update user data
        if (onUserUpdate) {
          onUserUpdate({
            ...user,
            fullName: profileData.name,
            email: profileData.email,
            profile: profileData.profilePic,
          })
        }

        toast.success("Profile updated successfully!")
      } else {
        toast.success("Password updated successfully!")
      }
    } catch (error) {
      setAlertInfo({
        show: true,
        message: error.response?.data?.error || "Failed to save profile data",
        variant: "danger",
      })
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handleProfileCancel = () => {
    setProfileData(savedProfileData)
    setImagePreview(savedProfileData.profilePic || null)
    setIsDataChanged(false)
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Profile Settings Modal/Drawer */}
      <div className={`profile-modal-overlay ${isMobile ? "mobile" : "desktop"}`}>
        <div className={`profile-modal-content ${isMobile ? "mobile-drawer" : "desktop-modal"}`}>
          {/* Modal Header */}
          <div className="profile-modal-header">
            <div className="profile-modal-title">
              <User2 size={20} className="me-2" />
              Profile Settings
            </div>
            <button className="profile-modal-close" onClick={handleCloseProfileModal}>
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="profile-modal-body">
            {alertInfo.show && (
              <div className={`alert alert-${alertInfo.variant === "danger" ? "error" : "success"}`}>
                {alertInfo.message}
              </div>
            )}

            {isProfileLoading ? (
              <div className="profile-loading">
                <ThreeDots color="#0070f3" height={40} width={40} />
                <p>Updating profile...</p>
              </div>
            ) : (
              <div className="profile-content">
                {/* Profile Picture Section */}
                <div className="profile-picture-section">
                  <div className="profile-picture-container">
                    {uploadingImage ? (
                      <div className="profile-picture-loading">
                        <ThreeDots color="#0070f3" height={30} width={30} />
                      </div>
                    ) : imagePreview ? (
                      <img src={imagePreview || "/placeholder.svg"} alt="Profile" className="profile-picture" />
                    ) : (
                      <div className="profile-picture-placeholder">
                        <User2 size={40} />
                      </div>
                    )}
                  </div>

                  <div className="profile-picture-actions">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="file-input-hidden"
                      accept="image/png, image/jpeg, image/gif, image/webp"
                    />
                    <button className="btn btn-outline" onClick={triggerFileInput} disabled={uploadingImage}>
                      <Camera size={16} className="me-1" />
                      {uploadingImage ? "Uploading..." : "Change Photo"}
                    </button>
                  </div>

                  <div className="profile-picture-hint">
                    Recommended: Square JPG, PNG, GIF or WEBP. Max size: 5MB
                  </div>
                </div>

                {/* Profile Form */}
                <div className="profile-form">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileData.name}
                      onChange={(e) => handleProfileInputChange("name", e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={profileData.email}
                      onChange={(e) => handleProfileInputChange("email", e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="password-field">
                      <input type="password" className="form-input" value="********" disabled />
                      <button className="btn btn-outline" onClick={handleChangePassword}>
                        <Shield size={16} className="me-1" />
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="profile-modal-footer">
            <button
              className="btn btn-outline"
              onClick={handleProfileCancel}
              disabled={!isDataChanged || isProfileLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleProfileSave(false)}
              disabled={!isDataChanged || isProfileLoading}
            >
              <Save size={16} className="me-1" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordPopupOpened && (
        <div className="password-modal-overlay">
          <div className="password-modal-content">
            <div className="password-modal-header">
              <div className="password-modal-title">
                <Shield size={20} className="me-2" />
                Change Password
              </div>
              <button className="password-modal-close" onClick={() => setIsChangePasswordPopupOpened(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="password-modal-body">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="password-modal-footer">
              <button className="btn btn-outline" onClick={() => setIsChangePasswordPopupOpened(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePasswordSave}
                disabled={!newPassword || !confirmPassword}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Profile Modal Styles */
        .profile-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1060;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-modal-overlay.mobile {
          align-items: flex-end;
          justify-content: stretch;
        }

        .profile-modal-content {
          background-color: #1E1E1F;
          color: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .profile-modal-content.mobile-drawer {
          width: 100%;
          max-width: none;
          border-radius: 12px 12px 0 0;
          max-height: 85vh;
          animation: slideUp 0.3s ease-out;
        }

        .profile-modal-content.desktop-modal {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .profile-modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #252526;
        }

        .profile-modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          display: flex;
          align-items: center;
        }

        .profile-modal-close {
          background: none;
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .profile-modal-close:hover {
          background-color: #333;
        }

        .profile-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .profile-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 1rem;
        }

        .profile-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .profile-content {
            flex-direction: row;
            gap: 2rem;
          }
        }

        .profile-picture-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }

        @media (min-width: 768px) {
          .profile-picture-section {
            width: 200px;
          }
        }

        .profile-picture-container {
          position: relative;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          overflow: hidden;
          background: #2A2A2B;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 3px solid #333;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .profile-picture {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-picture-placeholder {
          color: #666;
        }

        .profile-picture-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.7);
        }

        .profile-picture-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .profile-picture-hint {
          text-align: center;
          font-size: 0.75rem;
          color: #999;
          max-width: 200px;
        }

        .profile-form {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-weight: 500;
          color: #fff;
        }

        .form-input {
          background: #2A2A2B;
          color: white;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 0.75rem;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #0070f3;
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .password-field {
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
        }

        .password-field .form-input {
          flex: 1;
        }

        .file-input-hidden {
          display: none;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border: none;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #0070f3;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0051a2;
        }

        .btn-outline {
          background: transparent;
          color: white;
          border: 1px solid #444;
        }

        .btn-outline:hover:not(:disabled) {
          background: #333;
        }

        .btn-outline-danger {
          background: transparent;
          color: #ff6b6b;
          border: 1px solid #ff6b6b;
        }

        .btn-outline-danger:hover:not(:disabled) {
          background: #ff6b6b;
          color: white;
        }

        .profile-modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #333;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          background: #252526;
        }

        .alert {
          padding: 0.75rem 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .alert-success {
          background: rgba(40, 167, 69, 0.2);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.3);
        }

        .alert-error {
          background: rgba(220, 53, 69, 0.2);
          color: #ff6b6b;
          border: 1px solid rgba(220, 53, 69, 0.3);
        }

        /* Password Modal Styles */
        .password-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1070;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-modal-content {
          background-color: #1E1E1F;
          color: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          max-width: 400px;
          width: 90%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.3s ease-out;
        }

        .password-modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #252526;
        }

        .password-modal-title {
          font-size: 1.125rem;
          font-weight: 600;
          display: flex;
          align-items: center;
        }

        .password-modal-close {
          background: none;
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .password-modal-close:hover {
          background-color: #333;
        }

        .password-modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .password-modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #333;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          background: #252526;
        }

        /* Mobile Responsive Adjustments */
        @media (max-width: 767px) {
          .profile-modal-content {
            margin: 1rem;
            max-height: calc(100vh - 2rem);
          }

          .profile-modal-body {
            padding: 1rem;
          }

          .profile-modal-header,
          .profile-modal-footer {
            padding: 1rem;
          }

          .profile-picture-container {
            width: 120px;
            height: 120px;
          }

          .profile-picture-actions {
            flex-direction: column;
            align-items: center;
          }
        }

        /* Very small screens */
        @media (max-width: 480px) {
          .profile-modal-content.mobile-drawer {
            max-height: 90vh;
          }
        }
      `}</style>
    </>
  )
}

export default ProfileModal
