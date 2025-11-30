import { MenuItem, Order, OrderStatus } from './types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 1,
    name: 'Ensalada Fresca',
    price: 12.50,
    category: 'Platos Fuertes',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsnNTc-ihkzIPU45vMspOx5xgL-GGZTGxHoEqKhLcUtnBOFGT47MFpjVhwkcm6i4xzLizSAyjks3s_Q8Y4lHiqU5HpJlc8UOdPK6t4BIlia7_jQnSF7g8DcOOBxbFHhq1qdHEnVVTKD-aTTpRN0huOI-WPlRr-LAyfLO0qUl7KlUlHu_IHuuqcx_HiU4ymSO1OKCfG8cXCzqQsicn-I6HvJeEawfN1WuP989TUROC1FfKD05GlqRLIS9yDPrX3XrrqmmZpgQNPerux'
  },
  {
    id: 2,
    name: 'Pizza de Pepperoni',
    price: 18.00,
    category: 'Platos Fuertes',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrFiGw_kK2ijp6ciP5_8IUKCSqh_uyEU5lTme5TlrviXjxpyL10NuGWYaaz_GMfM1qEOF2Rbf_tsje1HcL2aGoYdmJIXIotu3__llSnz8l5kktgaoDHcPO0JmgKP0io6JkQRp5o39J9j8OaEvdy_Bf32SahJ62bUVf2dbeMW85o1RHlcbjTdPsU-Op5BdBz07LpW3W6RnByi-oKsRHOuXxYH5p2cDmq-84YPHaTvLVscul9R5_pnD7UhVj9GydS8bMOaLaOJfAID7t'
  },
  {
    id: 3,
    name: 'Pancakes con Frutas',
    price: 9.75,
    category: 'Postres',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0qgrRjTjNOAtqwXrb4xDtWJlTmIYNbHefpenlxmnfNsdYmwEgsHYKRjwg7AkMvmHO72WpyhPJ_r5XW-xwe-Lk00aDY8wPzME8qck_Xc7qAhD-FYBw0JYrfviW15lCV87h5-UZld93zTnJ_akl7ZwuGhFL9C80s8qHrFw0iaki4wA-9bScZzi8bBYLSNdCHm_fcjN180-MrkfgE6P_rP4FRgHRrM_CpJD6KpiEhEAks2YLGVLpKR9bVCa0SMOb9ymxCMOxHtHC8duN'
  },
  {
    id: 4,
    name: 'Pollo a la Parrilla',
    price: 22.00,
    category: 'Platos Fuertes',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC76Uk3apvVY8XWNXaU323IQpiOjuiaqu-oyKnXzRqvm_6hpFMSFxdB5EYMo1R11ZYZvb_V2WdBeLjS0TO-iXt_4PebX5NLrgk7_Kcg7KwC0YNubKV27nEVZn5hrw1bZ2ahpKSy3I_NxXNT1XiR5MHhmIyjqsChpUliHfGbD3jHrwEuXLZbYoNOQdINXAN7ou-DtHJwWtPjYgRcDGEfXaznTdodyE9w9L6oynfewd30NZgVWVNPcqbGYUHp1hNQe7a5AVsgBZN9XLFZ'
  },
  {
    id: 5,
    name: 'Tacos de Carnitas',
    price: 15.50,
    category: 'Platos Fuertes',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp4VGgkmtBRifEul3d2RKpDOna2Ez20Sjr0y1Pv906O8BwuUKZlrGW-anjFqy5_khOeyogiReG4hYeP5pmD-q6rb5Dho-hFvqRtTsmHUJINNZOojoBx0tQWc7NdXLpA94Z4JxW2T4_uM1g-zgHk1AaiDzBOxOb32oVuzzvQ2gPzW3Lc88gPKuPH7QBbDpjs4lMXta1Kp75VMi4WZyTUqAoRVimkA2lfBW7yziwBrn2nwayQNax337QhdCeAbsHjTUNiqAcQIh_bBEm'
  },
  {
    id: 6,
    name: 'Cóctel Tropical',
    price: 8.00,
    category: 'Bebidas',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDF1KotMpukwcW32UxUhC1RNpRYj2qgYfcuy5hlxTMnRPLjDOutAkHboW0zSsSYZ3uED0g0YbGxpLEaYfKGxgCLupPlqmNPz5ciVPLVa-xgMTCnUr-xn-Uotcbyz4S7IydQTHP8N1Nf3etWP6JeR_Q3FgRUVI_7zVHjXtIyM_HYHSKFqqIshwfN9W_VZWLtnKE8WKAf1lmVEHRCIyrgkfzqEfbnu0nH99xmCRHRg54Lh6l4RtOrxrK4_9gL-oZixTYuSiDQCff4Vmnu'
  },
   {
    id: 7,
    name: 'Hamburguesa Clásica',
    price: 15.00,
    category: 'Platos Fuertes',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBs4InadYNTL86cnUVlTkoDvNM8S4sxhwITS_5h2Bnyh4FW5JXo6AD2WA2ndFabPDczrCmUK8fVbD8Mbe-mv9k-n9ElGhRj7Rsjq-Ctk5hS-tHkS_OKfP4Hqhx1Oc_h5UJcZDxofn5W4c4Ci2eDfmnkuE1YsexkJwyJDAS8wiYVHmklkp6ocfIizJPy1t-JaeMDeLoAx3kEMQORfDE7vifXTipYOARtSvBBi0SE7Hi6XK0g3a43ZOv_aIbuJwcohClbC1q2rJjHqWA6'
  },
  {
    id: 8,
    name: 'Papas Fritas',
    price: 6.00,
    category: 'Entradas',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgBqDHxeLHFIfPMx2IliTucDHDz8rtQJD-IIypF4obhq4CfIz9xqnK6yvunydQO0DtBIb-ZdYQIXnPr9VjgAM9L7hXrauuxNWEfxmqb8W-iA9ZXgwVpFPCTPSy7gbDMTGbi9IosBaOvLcju5YawsBPMSjd6s9cmKPnYXPDGw0PWWFCQ79LZ1sV-nuUjlbm5RxPRxypADuvcgbbQUkcH7m42fVSFvOlC5ejgLc9wjqwe9VkHfyusFiPIXKwe5xyK2t27bPuYbWsaBcg'
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'A8B-234',
    customerName: 'Carlos Vega',
    customerEmail: 'carlos.vega@email.com',
    items: [
      { ...MENU_ITEMS[6], quantity: 1 },
      { ...MENU_ITEMS[7], quantity: 1 },
      { ...MENU_ITEMS[5], quantity: 2, name: 'Refresco Grande', price: 2.50 }
    ],
    total: 24.50,
    status: OrderStatus.COMPLETED,
    timestamp: new Date('2024-07-12T20:45:00'),
    type: 'Dine-in'
  },
  {
    id: 'A8B-233',
    customerName: 'Ana Torres',
    items: [
       { ...MENU_ITEMS[0], quantity: 1 },
    ],
    total: 15.00,
    status: OrderStatus.COMPLETED,
    timestamp: new Date('2024-07-12T19:30:00'),
    type: 'Dine-in'
  },
  {
    id: 'A8B-230',
    customerName: 'Javier Morales',
    items: [
       { ...MENU_ITEMS[1], quantity: 1 },
    ],
    total: 19.99,
    status: OrderStatus.PENDING,
    timestamp: new Date('2024-07-11T20:15:00'),
    type: 'Dine-in'
  }
];

export const KITCHEN_TICKETS = [
  {
    id: '#1024',
    customerName: 'Ana G.',
    tableNumber: 5,
    elapsedTime: '05:32',
    items: [
      { name: 'Hamburguesa Clásica', quantity: 2, notes: 'Sin cebolla' },
      { name: 'Papas Fritas', quantity: 1 },
      { name: 'Refresco de Cola', quantity: 1 },
    ],
    status: 'high'
  },
  {
    id: '#1025',
    customerName: 'Carlos P.',
    type: 'Para Llevar',
    elapsedTime: '03:15',
    items: [
      { name: 'Ensalada César con pollo', quantity: 1 },
      { name: 'Agua Embotellada', quantity: 1 },
    ],
    status: 'normal'
  },
  {
    id: '#1026',
    customerName: 'Luisa M.',
    tableNumber: 2,
    elapsedTime: '01:48',
    items: [
      { name: 'Pizza Margarita', quantity: 1 },
      { name: 'Pizza Pepperoni', quantity: 1, notes: 'Extra queso' },
      { name: 'Limonada', quantity: 2 },
    ],
    status: 'normal'
  },
  {
    id: '#1023',
    customerName: 'Roberto V.',
    tableNumber: 8,
    elapsedTime: '15:12',
    items: [
      { name: 'Sopa de Tortilla', quantity: 1 },
      { name: 'Tacos al Pastor (x3)', quantity: 1 },
    ],
    status: 'late'
  }
];