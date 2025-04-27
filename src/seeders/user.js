
import {faker} from "@faker-js/faker"
import User from "../models/user.js";

const createUser = async (numUser) => {
  try {
    const userPromise = [];
    for (let i = 0; i < numUser; i++) {
      const tempUser = User.create({
        name: faker.person.fullName(),
        userName: faker.internet.userName(),
        bio: faker.lorem.lines(),
        password: "user1234",
        avatar: {
          url: faker.image.avatar(),
          public_id: faker.system.fileName(),
        },
      });
      userPromise.push(tempUser);
    }
    await Promise.all(userPromise);
    console.log("User created", numUser);
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export { createUser};
