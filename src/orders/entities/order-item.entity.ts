import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Relación N:1 hacia Order — muchos items pertenecen a una orden
  // onDelete CASCADE: al borrar la orden se borran sus items
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column({ type: 'varchar' })
  orderId!: string;

  // Relación N:1 hacia Product — muchos items referencian un producto
  // eager:true carga el producto automáticamente al hacer find de OrderItem (didáctico)
  @ManyToOne(() => Product, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'varchar' })
  productId!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  // Precio unitario al momento de comprar — no cambia si Product.price cambia luego
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;
}
