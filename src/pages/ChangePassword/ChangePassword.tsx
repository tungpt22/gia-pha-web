// ChangePassword.tsx
import * as React from "react";
import "./ChangePassword.css";
import { changePassword } from "./changePasswordApi";

type ModalProps = {
  message: string;
  onClose: () => void;
};
function MessageModal({ message, onClose }: ModalProps) {
  return (
    <div className="cp-modal-backdrop">
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-modal-head">
          <div className="cp-modal-title">Thông báo</div>
        </div>
        <div className="cp-modal-body">
          <div className="cp-msg">{message}</div>
          <div className="cp-modal-footer">
            <button className="cp-btn cp-btn--primary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChangePassword() {
  const [oldPwd, setOldPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [newPwd2, setNewPwd2] = React.useState("");

  const [show, setShow] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Simple validations
  const sameNew = newPwd === newPwd2;
  const minLenOK = newPwd.length >= 8;
  const canSubmit =
    oldPwd.length > 0 &&
    newPwd.length > 0 &&
    newPwd2.length > 0 &&
    sameNew &&
    minLenOK &&
    !submitting;

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      const res = await changePassword({
        oldPassword: oldPwd,
        newPassword: newPwd,
      });
      // Server có thể trả message ở data.message hoặc data.data.message
      const serverMsg =
        (res as any)?.data?.message ||
        (res as any)?.message ||
        "Thao tác hoàn tất";
      setMsg(serverMsg);
      setShow(true);
      // Clear form sau khi đổi thành công
      setOldPwd("");
      setNewPwd("");
      setNewPwd2("");
    } catch (err: any) {
      const serverMsg =
        err?.message || "Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.";
      setMsg(serverMsg);
      setShow(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cp-wrap">
      <form className="cp-card" onSubmit={onSubmit}>
        <div className="cp-title">Đổi mật khẩu</div>

        <div className="cp-field">
          <label>Mật khẩu hiện tại</label>
          <input
            type="password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
            autoComplete="current-password"
          />
        </div>

        <div className="cp-field">
          <label>Mật khẩu mới</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="Ít nhất 8 ký tự"
            autoComplete="new-password"
          />
          {!minLenOK && newPwd.length > 0 && (
            <div className="cp-hint cp-hint--error">
              Mật khẩu phải từ 8 ký tự trở lên.
            </div>
          )}
        </div>

        <div className="cp-field">
          <label>Nhập lại mật khẩu mới</label>
          <input
            type="password"
            value={newPwd2}
            onChange={(e) => setNewPwd2(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
          />
          {!sameNew && newPwd2.length > 0 && (
            <div className="cp-hint cp-hint--error">
              Mật khẩu nhập lại không khớp.
            </div>
          )}
        </div>

        <div className="cp-actions">
          <button
            type="submit"
            className="cp-btn cp-btn--primary"
            disabled={!canSubmit}
          >
            {submitting ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
          <button
            type="button"
            className="cp-btn"
            onClick={() => {
              setOldPwd("");
              setNewPwd("");
              setNewPwd2("");
            }}
            disabled={submitting}
          >
            Xóa tất cả
          </button>
        </div>
      </form>

      {show && <MessageModal message={msg} onClose={() => setShow(false)} />}
    </div>
  );
}
