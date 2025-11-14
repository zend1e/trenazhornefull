import { Level } from './types';

export const LEVELS: Level[] = [
  {
    id: 'level1',
    name: 'Уровень 1: Простые движения',
    phrases: [
      {id:1, text:'Денсаулық– зор байлық.'},
      {id:2, text:'Еңбек түбі– береке.'},
      {id:3, text:'Бірлік бар жерде– тірлік бар.'},
      {id:4, text:'Табиғат– ортақ үйіміз.'},
      {id:5, text:'Адалдық– адамдықтың белгісі.'}
    ],
    trajPresets: [
      { key:'vertical',     title:'Вертикаль' },
      { key:'horizontal',   title:'Горизонталь' },
      { key:'diagonal-rl',  title:'Диагональ ↘' },
      { key:'diagonal-lr',  title:'Диагональ ↙' },
    ],
    params: {speed:0.7, textSize:32, color:'#338899', interval:26}
  },
  {
    id: 'level2',
    name: 'Уровень 2: Сложные движения',
    phrases: [
      {id:6, text:'Шыншыл адам– сенімді адам.'},
      {id:7, text:'Отансыз адам, ормансыз бұлбұл.'},
      {id:8, text:'Үлкенге– құрмет, кішіге– ізет.'},
      {id:9, text:'Шындық– күндей, оны бұлт баспайды.'},
      {id:10, text:'Жақсы мінез адамның көркі.'}
    ],
    trajPresets: [
      { key:'zigzag',       title:'Зигзаг' },
      { key:'complex8',     title:'Восьмёрка' },
      { key:'lcorner',      title:'Угол' }
    ],
    params: {speed:0.7, textSize:32, color:'#338899', interval:18}
  }
];
