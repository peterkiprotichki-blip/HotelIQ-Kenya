import { Document, Model } from 'mongoose';
import { BaseRepositoryInterface } from '../interfaces/base-repository.interface';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';
import { PaginationOptions } from '../interfaces/pagination-options.interface';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';

export abstract class BaseRepository<T extends Document>
  implements BaseRepositoryInterface<T>
{
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    try {
      const entity = new this.model(data);
      return await entity.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(`Duplicate key error: ${error.message}`);
      }
      throw new InternalServerErrorException(
        `Failed to create entity: ${error.message}`,
      );
    }
  }

  async findById(id: string): Promise<T> {
    return this.model.findById(id).exec();
  }

  async findAll(): Promise<T[]> {
    return this.model.find({ isDeleted: false }).exec();
  }

  async findOne(filter: any): Promise<T | null> {
    return this.model.findOne({ ...filter, isDeleted: false }).exec();
  }

  async findBy(filter: any): Promise<T[]> {
    return this.model.find({ ...filter, isDeleted: false }).exec();
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.model
      .findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model
      .findByIdAndUpdate(id, { isDeleted: true, updatedAt: new Date() })
      .exec();
    return !!result;
  }

  async findPaginated(
    options: PaginationOptions<T> = {},
  ): Promise<PaginatedResponse<T>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt' as keyof T,
      sortOrder = 'desc',
      filter = {},
    } = options;

    const skip = (page - 1) * limit;
    const baseFilter = { ...filter, isDeleted: false };

    const [total, data] = await Promise.all([
      this.model.countDocuments(baseFilter),
      this.model
        .find(baseFilter)
        .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
