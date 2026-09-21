import { AppError } from "../errors/app-error.js";
import {
  UserRepository,
  CreateUserData,
  User,
} from "../repositories/user.repository.js";


//This is where business logic belongs.
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async getUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new AppError(
        "User not found",
        404,
        "USER_NOT_FOUND",
      );
    }

    return user;
  }

  async createUser(data: CreateUserData): Promise<User> {
    const existingUser =
      await this.userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError(
        "A user with this email already exists",
        409,
        "USER_EMAIL_EXISTS",
      );
    }

    return this.userRepository.create(data);
  }
}