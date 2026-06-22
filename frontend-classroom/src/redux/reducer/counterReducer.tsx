/* import { INCREMENT, DECREMENT } from '../action/'; // Đảm bảo đúng đường dẫn

interface CounterState {
  count: number;
  name: string;
}

const INITIAL_STATE: CounterState = {
  count: 0,
  name: 'Eric'
};

const countReducer = (state = INITIAL_STATE, action: any): CounterState => {
  switch (action.type) {
    case INCREMENT:
      return { ...state, count: state.count + 1 };
    case DECREMENT:
      return { ...state, count: state.count - 1 };
    default: 
      return state;
  }
};

export default countReducer; */