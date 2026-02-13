import request from "@/utils/request.js";

export const rechargeApi = (data) => {
  return request({
    url: "/student/auth/recharge",
    method: "POST",
    data,
  });
};
