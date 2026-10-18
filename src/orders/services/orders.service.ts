import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from '../dto/create-order.dto';
import { FilterOrderDto } from '../dto/filter-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  // Crear orden con transacción — ejemplo didáctico de relaciones y consistencia
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar usuario existe y está activo
      const user = await queryRunner.manager.findOneBy(User, {
        id: createOrderDto.userId,
        isActive: true,
      });
      if (!user) {
        throw new NotFoundException(
          `El usuario con id ${createOrderDto.userId} no existe o está inactivo`,
        );
      }

      // 2. Validar productos y stock, calcular total y preparar items
      let total = 0;
      const orderItems: Partial<OrderItem>[] = [];

      for (const itemDto of createOrderDto.items) {
        const product = await queryRunner.manager.findOneBy(Product, {
          id: itemDto.productId,
          isActive: true,
        });
        if (!product) {
          throw new NotFoundException(
            `El producto con id ${itemDto.productId} no existe o está inactivo`,
          );
        }
        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}: disponible ${product.stock}, solicitado ${itemDto.quantity}`,
          );
        }

        const unitPrice = Number(product.price);
        total += unitPrice * itemDto.quantity;

        // Descontar stock dentro de la transacción
        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(Product, product);

        orderItems.push({
          productId: product.id,
          quantity: itemDto.quantity,
          unitPrice,
        });
      }

      // 3. Crear orden con items en cascada
      const order = queryRunner.manager.create(Order, {
        userId: user.id,
        total: Number(total.toFixed(2)),
        status: OrderStatus.PENDING,
        items: orderItems as OrderItem[],
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      await queryRunner.commitTransaction();

      // 4. Retornar orden completa con relaciones (items + product eager)
      return this.findOne(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Rama 4: filtros simples (status, userId)
  // Ej: GET /orders?status=PENDING&userId=1234567890
  async findAll(filter?: FilterOrderDto): Promise<Order[]> {
    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('order.user', 'user');

    if (filter?.status) {
      qb.andWhere('order.status = :status', { status: filter.status });
    }
    if (filter?.userId) {
      qb.andWhere('order.userId = :userId', { userId: filter.userId });
    }

    qb.orderBy('order.createdAt', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: {
        items: true,
        user: true,
      },

    });
    if (!order) {
      throw new NotFoundException(`La orden con id ${id} no existe`);
    }
    return order;
  }

  findByUser(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: {
        items: true,
        user: true,
      },

      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    // Solo permitimos transición PENDING -> PAID/CANCELLED en este ejemplo
    if (dto.status && dto.status !== order.status) {
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          `Solo se puede cambiar estado desde PENDING, estado actual: ${order.status}`,
        );
      }
      // Si cancela, restaurar stock
      if (dto.status === OrderStatus.CANCELLED) {
        return this.cancel(id);
      }
      order.status = dto.status;
      return this.ordersRepository.save(order);
    }
    return order;
  }

  // Cancelar = CANCELLED + restaurar stock (transacción)
  async cancel(id: string): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id },
        relations: {items:true},
      });
      if (!order) {
        throw new NotFoundException(`La orden con id ${id} no existe`);
      }
      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('La orden ya está cancelada');
      }
      if (order.status === OrderStatus.PAID) {
        throw new BadRequestException('No se puede cancelar una orden pagada');
      }

      // Restaurar stock de cada producto
      for (const item of order.items) {
        const product = await queryRunner.manager.findOneBy(Product, {
          id: item.productId,
        });
        if (product) {
          product.stock += item.quantity;
          await queryRunner.manager.save(Product, product);
        }
      }

      order.status = OrderStatus.CANCELLED;
      await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // DELETE hard para didáctica — en producción preferir soft/cancel
  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    // Si está PENDING, restauramos stock antes de borrar
    if (order.status === OrderStatus.PENDING) {
      await this.cancel(id);
    }
    await this.ordersRepository.remove(order);
  }
}
