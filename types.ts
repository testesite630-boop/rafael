
export type UserRole = 'ADMIN' | 'MOTOBOY';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
}

export enum DeliveryStatus {
  PENDING = 'PENDING',    // Recém adicionada pelo Admin
  IN_ROUTE = 'IN_ROUTE',  // Despachada para o Motoboy
  PICKED_UP = 'PICKED_UP',// Retirada/Coletada pelo Motoboy no ponto de coleta
  DELIVERED = 'DELIVERED',// Entregue ao destino final
  FAILED = 'FAILED'       // Tentativa sem sucesso
}

export interface Delivery {
  id: string;
  pickupAddress?: string; 
  address: string;        
  receiverName?: string;
  document?: string;
  photoUrl?: string;
  pickupPhotoUrl?: string; // Foto do item no momento da coleta
  status: DeliveryStatus;
  createdAt: string;
  completedAt?: string;
  lat?: number;
  lng?: number;
  order: number;
  failureReason?: string;
  motoboyName?: string;   
  pickupPersonName?: string; // Nome de quem entregou o pedido ao motoboy na coleta
  pickedUpAt?: string;       // Data/Hora da coleta
}

export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  accentColor: 'indigo' | 'blue' | 'rose' | 'emerald' | 'amber';
}
