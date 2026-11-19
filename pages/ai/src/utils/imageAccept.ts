/**
 * 图像域上传的格式口径（产品定版）：png / jpeg / webp / bmp / gif。
 *
 * <p>此前图库与搜图的 accept 是两份相同字面量，改格式要记得改两处；
 * 收敛为一个常量，图像库里「支持哪些格式」只说一次。OCR / ReID / 人脸
 * 等页面的后端只支持子集，仍各自用 accept="image/*" 或更窄的列表，
 * 不跟本常量对齐。</p>
 */
export const IMAGE_UPLOAD_ACCEPT = 'image/png,image/jpeg,image/webp,image/bmp,image/gif'
