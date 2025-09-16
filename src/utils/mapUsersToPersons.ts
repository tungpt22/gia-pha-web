import type { Person } from "../pages/CayPhaHe/CayPhaHe";

/** Sửa lại tên field cho khớp model Users hiện tại của bạn. */
export type User = {
  id: string;
  hoTen: string;
  gioiTinh: "Nam" | "Nữ";
  ngaySinh?: string;
  ngayMat?: string;
  anhDaiDien?: string;
  boId?: string;
  meId?: string;
  spouses?: string[]; // danh sách id vợ/chồng
  isRoot?: boolean;
};

export function mapUsersToPersons(users: User[]): Person[] {
  return users.map((u) => ({
    id: u.id,
    name: u.hoTen,
    gender: u.gioiTinh,
    dob: u.ngaySinh,
    dod: u.ngayMat,
    photoUrl: u.anhDaiDien,
    fatherId: u.boId,
    motherId: u.meId,
    spouseIds: u.spouses ?? [],
    isRoot: u.isRoot,
  }));
}
