import { MenuItem } from "@/types/menu";

export const menuItems: MenuItem[] = [
  // Tea items
  { id: "1", name: "Chiya", nameNp: "चिया", price: 20, category: "Tea" },
  { id: "2", name: "Black Tea", nameNp: "कालो चिया", price: 20, category: "Tea" },
  { id: "3", name: "Milk Tea", nameNp: "दुध चिया", price: 25, category: "Tea" },
  { id: "4", name: "Masala Tea", nameNp: "मसला चिया", price: 30, category: "Tea" },
  { id: "5", name: "Green Tea", nameNp: "हरियो चिया", price: 30, category: "Tea" },
  { id: "6", name: "Lemon Tea", nameNp: "कागती चिया", price: 30, category: "Tea" },
  { id: "7", name: "Ginger Tea", nameNp: "अदुवा चिया", price: 25, category: "Tea" },
  
  // Coffee
  { id: "8", name: "Black Coffee", nameNp: "कालो कफी", price: 40, category: "Coffee" },
  { id: "9", name: "Milk Coffee", nameNp: "दुध कफी", price: 50, category: "Coffee" },
  { id: "10", name: "Cappuccino", nameNp: "क्यापुचिनो", price: 80, category: "Coffee" },
  
  // Snacks
  { id: "11", name: "Samosa", nameNp: "समोसा", price: 25, category: "Snacks" },
  { id: "12", name: "Pakora", nameNp: "पकौडा", price: 40, category: "Snacks" },
  { id: "13", name: "Momo (Veg)", nameNp: "मोमो (भेज)", price: 100, category: "Snacks" },
  { id: "14", name: "Momo (Buff)", nameNp: "मोमो (बफ)", price: 120, category: "Snacks" },
  { id: "15", name: "Chowmein", nameNp: "चाउमिन", price: 80, category: "Snacks" },
  { id: "16", name: "Fried Rice", nameNp: "फ्राइड राइस", price: 100, category: "Snacks" },
  
  // Burger
  { id: "17", name: "Veg Burger", nameNp: "भेज बर्गर", price: 80, category: "Burger" },
  { id: "18", name: "Chicken Burger", nameNp: "चिकन बर्गर", price: 120, category: "Burger" },
  { id: "19", name: "Cheese Burger", nameNp: "चिज बर्गर", price: 100, category: "Burger" },
  
  // Cold Drinks
  { id: "20", name: "Lassi", nameNp: "लस्सी", price: 50, category: "Drinks" },
  { id: "21", name: "Lemon Soda", nameNp: "कागती सोडा", price: 40, category: "Drinks" },
  { id: "22", name: "Cold Coffee", nameNp: "चिसो कफी", price: 70, category: "Drinks" },
];

export const categories = ["All", "Tea", "Coffee", "Snacks", "Burger", "Drinks"];
