import jwt from "jsonwebtoken";

const sendToken = (res, user, message, statusCode) => {
  // console.log("user", user);
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "5D",
  });
  console.log("token", token);
  return res
    .status(statusCode)
    .cookie("chat2", token, {
      maxAge: 24 * 60 * 60 * 1000 * 5,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .json({ success: true, message, user });
};
export default sendToken;
