const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const commonFunction = require('../utils/commonFunction')
const authController = require('./authController');
const jwt = require('jsonwebtoken');

exports.signup = catchAsync(async (req, res, next) => {
  const isUserEmailExists = await User.findOne({ email: req.body.email });
  if (isUserEmailExists) {
    return next(new AppError('User already added with this email', 400));
  }
  if (!req.body.email || !req.body.password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  if (!req.body.phoneNumber) {
    return next(new AppError('Please provide mobile number!', 400));
  }
  if (!req.body.zipCode) {
    return next(new AppError('Please provide Zip Code!', 400));
  }
  const newUser = await User.create({
    name: req.body.name ,
    email: req.body.email ,
    password: req.body.password,
    phoneNumber: req.body.phoneNumber,
    profilePic: req.body.profilePic,
    zipCode: req.body.zipCode,
    currentLocation: req.body.currentLocation
  });

  authController.createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email });

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  
  await User.findOneAndUpdate({ _id: user._id }, { currentLocation: req.body.currentLocation })
  // 3) If everything ok, send token to client
  authController.createSendToken(user, 200, res);
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password) {
    return next(
      new AppError(
        'This route is not for password updates.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = commonFunction.filterObj(req.body, 'name', 'phoneNumber', 'profilePic', 'email', 'zipCode');
  
  const isEmailAlreadyExists = await User.findOne({ email:req.body.email, _id: {$ne: req.user._id } })
  
  if (isEmailAlreadyExists) {
    return next(new AppError('User already added with this email', 400));
  }

  // 3) Update user document
  let updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
  });
  
  updatedUser.password = undefined;
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.findNearestUsers = catchAsync(async (req, res, next) => {
  let criteria = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: req.body.coordinates },
        distanceField: "distance",
        query: {_id: { $ne: req.user._id }}
      }
    },
    {
      $sort: { distance: 1 },
    },
    {
      $limit: 5
    },
    {
      $project: {
        name: 1,
        profilePic: 1,
        email: 1,
        phoneNumber: 1
      }
    }
  ]
  const data = await User.aggregate(criteria);
  res.status(200).json({
    status: 'success',
    data: data
  });
})

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  await user.save();

  // 4) Log user in, send JWT
  authController.createSendToken(user, 200, res);
});