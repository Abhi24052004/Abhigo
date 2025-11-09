const expres=require("express");
const router=expres.Router();
const {body}=require("express-validator");
const userController=require('../controller/user.controller');
const authMiddleware=require("../middlewares/authMidlleware");

router.post("/register",[
    body('Email').isEmail().withMessage('Invalid Email'),
    body('FullName.FirstName').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
    body('pasword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')],
    userController.registerUser
)

router.post("/login",[
    body('Email').isEmail().withMessage('Invalid Email'),
    body('pasword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')],
    userController.loginUser
)

router.get("/getprofile",authMiddleware.authUser,userController.getProfile);
router.get("/logout",authMiddleware.authUser,userController.logoutUser);
router.get('/findByEmail', userController.findByEmail);
router.post('/updatePassword', userController.updatePassword);

router.put('/update',
    authMiddleware.authUser,
    userController.updateUser
);

module.exports= router;
