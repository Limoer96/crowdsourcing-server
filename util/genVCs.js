// 生成6位数的验证码

module.exports = function genVCs(num) {
  const BASE='1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let str = '';
  for(let i = 0; i<num; i++) {
    let index = Math.floor(Math.random() * BASE.length);
    str += BASE[index];
  }
  return str.toUpperCase();
}
