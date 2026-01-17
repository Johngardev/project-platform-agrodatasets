import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true }) // Esto agrega createdAt y updatedAt automáticamente
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // Aquí guardaremos el HASH, no la contraseña plana

  @Prop({ required: true, default: 'Jhon Doe' })
  name: string;

  @Prop({ required: true, enum: ['ADMIN', 'USER'], default: 'USER' })
  role: string;

  // El sub-rol para diferenciar permisos de carga
  @Prop({
    required: true,
    enum: ['VIEWER', 'CONTRIBUTOR'],
    default: 'CONTRIBUTOR',
  })
  userType: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
