const { Cart, User, Course, Coupon, Favorite } = require("../models");

// Agrear Curso al carrito de compra
const addCart = async (req, res) => {
  const { courseId, userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send("Course not found");

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, courseId: [course._id] });
    } else {
      if (!cart.courseId.includes(course._id)) {
        cart.courseId.push(course._id);
      } else {
        return res.status(409).send("Course already in the cart");
      }
    }

    await cart.save();
    res.status(200).send(cart);
  } catch (error) {
    res.sendStatus(500);
  }
};

// Eliminar de a un curso del carrito de compra
const removeCourse = async (req, res) => {
  const { courseId, userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send("Course not found");

    let cart = await Cart.findOne({ userId });

    if (!cart) return res.status(404).send("Cart not found");

    const updatedCart = cart.courseId.filter(
      (course_id) => !course_id.equals(course._id)
    );
    cart.courseId = updatedCart;
    await cart.save();

    res.status(200).send(cart);
  } catch (error) {
    res.sendStatus(500);
  }
};

// Eliminar todo el carrito
const removeCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    let cart = await Cart.findOneAndRemove({ userId });
    if (!cart) return res.status(404).send("Cart not found");

    res.sendStatus(204);
  } catch (error) {
    res.sendStatus(500);
  }
};

// Ver los cursos que tengo en el carrito
const cartCourses = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId }).populate("courseId");
    if (!cart) return res.status(200).send([]);
    
    const favoritesUser = await Favorite.findOne({ userId });

    const courseUpdate = cart.courseId.map((course) => {
      const status_favorite = favoritesUser.courseId.includes(course._id);
      if (status_favorite) {
        return { ...course._doc, status_favorite: true };
      } else {
        return { ...course._doc, status_favorite: false };
      }
    });
    res.status(200).send(courseUpdate);
  } catch (error) {
    res.sendStatus(500);
  }
};

const totalAmountCart = async (req, res) => {
  const { userId } = req.params;
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).send("Cart not found");
    res.status(200).send(cart);
  } catch (error) {
    res.sendStatus(500);
  }
};

// Confirmacion de Compra
const confirmBuyCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("user not found");

    const cart = await Cart.findOne({ userId }).populate("courseId");
    if (!cart) return res.status(404).send("Cart not found");

    const courseData = cart.courseId.map((prop) => {
      let classesArr = [];
      const { modules } = prop;
      modules.forEach((module) => {
        const { topics } = module;
        topics.forEach((topic) => {
          const { classes } = topic;
          classes.forEach((oneClass) => {
            classesArr.push({
              classId: oneClass._id,
              classInfo: oneClass.classInfo,
              video_url: oneClass.video_url,
            });
          });
        });
      });
      return { courseId: prop._id, classes: classesArr };
    });
    user.course.push(...courseData);
    await user.save();

    cart.deleteOne();

    return res.status(200).send("Purchase confirmed");
  } catch (error) {
    res.sendStatus(500);
  }
};

// Agregar Descuento
const addDiscount = async (req, res) => {
  const { couponCode, mail } = req.body;

  try {
    const user = await User.findOne({ mail });
    if (!user) return res.status(404).send("user not found");

    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) return res.status(404).send("Cart not found");

    const validateCoupon = await Coupon.findOne({
      couponCode: couponCode.toUpperCase(),
      status: true,
    });
    if (!validateCoupon) return res.status(404).send("Coupon not found");

    const totalDiscount =
      cart.totalAmount -
      (cart.totalAmount * validateCoupon.discountCoupon) / 100;

    const newCart = await Cart.findOneAndUpdate(
      { _id: cart._id },
      { totalDiscount, discount: validateCoupon.discountCoupon },
      { new: true }
    );
    if (!newCart) res.status(404).send("Couldn`t add discount");

    res.status(200).send(newCart);
  } catch (error) {
    res.sendStatus(500);
  }
};

module.exports = {
  addCart,
  removeCourse,
  removeCart,
  cartCourses,
  confirmBuyCart,
  addDiscount,
  totalAmountCart,
};
