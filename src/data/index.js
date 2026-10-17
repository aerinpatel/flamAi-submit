// Static ingredient groups used by the picker and the modal.
export const CATEGORIES = [
  { name: 'Vegetables', img: 'vegetables', options: ['Tomato', 'Onion', 'Potato', 'Spinach', 'Carrot', 'Capsicum', 'Garlic', 'Cauliflower', 'Peas', 'Cucumber'] },
  { name: 'Fruits', img: 'fruits', options: ['Apple', 'Banana', 'Lemon', 'Mango', 'Orange', 'Berries', 'Grapes', 'Pineapple'] },
  { name: 'Proteins', img: 'proteins', options: ['Chicken', 'Paneer', 'Tofu', 'Fish', 'Lentils', 'Chickpeas', 'Beans', 'Mutton'] },
  { name: 'Grains & bread', img: 'grains', options: ['Rice', 'Wheat flour', 'Pasta', 'Oats', 'Bread', 'Noodles', 'Semolina'] },
  { name: 'Dairy & eggs', img: 'dairy', options: ['Milk', 'Eggs', 'Butter', 'Cheese', 'Curd', 'Cream', 'Ghee'] },
  { name: 'Spices & herbs', img: 'spices', options: ['Cumin', 'Turmeric', 'Chili', 'Basil', 'Coriander', 'Pepper', 'Garam masala'] },
]

export const ALL = CATEGORIES.flatMap((c, cat) => c.options.map((name) => ({ name, cat })))

// All site images live on S3.
const S3 = 'https://flamproj.s3.ap-south-1.amazonaws.com'
export const IMG = {
  chef2: `${S3}/chef2.png`,
  cloche: `${S3}/cloche.png`,
  fire: `${S3}/fire.png`,
  food: `${S3}/food.png`,
  man: `${S3}/man.png`,
  vegetables: `${S3}/vegetables.png`,
  fruits: `${S3}/fruits.png`,
  proteins: `${S3}/protines.png`,
  grains: `${S3}/Grains%26bread.png`,
  dairy: `${S3}/+Dairy%26eggs.png`,
  spices: `${S3}/Spices%26herbs.png`,
}

// Shown in the footer and the About page. Change these two lines to your own details.
export const AUTHOR = { name: 'Aerin Patel', github: 'https://github.com/aerinpatel' }

export const TECH = ['React 18', 'Vite', 'React Router', 'Tailwind CSS', 'Node.js + Express', 'Zod', 'Groq API', 'gpt-oss-120b']
