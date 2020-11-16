import store from '../redux/configureStore';
import { addToast } from '../redux/slices/navigationSlice';

const createSuccessToast = (title, text) => {
  addToastToList(title, text, 'success');
};

const createDangerToast = (title, text) => {
  addToastToList(title, text, 'danger');
};

const createWarningToast = (title, text) => {
  addToastToList(title, text, 'warning');
};

let id = 0;
const addToastToList = (title, text, color) => {
  store.dispatch(
    addToast({
      id: `${color}-${id++}`,
      title,
      color,
      text,
    })
  );
};

export { createSuccessToast, createDangerToast, createWarningToast };