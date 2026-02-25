import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { instance as axios } from '../config/axiosConfig';

import {
  SIGNUP_ERROR,
  SET_TOKEN,
  FETCH_USER_DATA_START,
  FETCH_USER_DATA_SUCCESS,
  FETCH_USER_DATA_FAILURE,
  SET_USER_DATA,
  CLEAR_USER_DATA,
  SET_USER_ERROR,
  USER_UPDATED
} from './ActionTypes';

/* ============================= */
/*           BASIC ACTIONS       */
/* ============================= */

export const setToken = (token) => ({
  type: SET_TOKEN,
  payload: token,
});

export const setUserData = (userData) => ({
  type: SET_USER_DATA,
  payload: userData,
});

export const clearUserData = () => ({
  type: CLEAR_USER_DATA,
});

export const setUserError = (error) => ({
  type: SET_USER_ERROR,
  payload: error,
});

export const userUpdated = (updatedData) => ({
  type: USER_UPDATED,
  payload: updatedData,
});

/* ============================= */
/*             LOGIN             */
/* ============================= */

export const login = (email, password, navigate) => {
  return async (dispatch) => {
    try {
      const response = await axios.post('/api/v1/auth/authenticate', {
        email,
        password,
      });

      if (response.data.token) {
        const { token, ...userData } = response.data;

        localStorage.setItem('token', token);
        dispatch(setToken(token));
        dispatch(setUserData(userData));

        toast.success('Login successful!', { autoClose: 3000 });

        if (userData.role === 'ADMIN') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error('Token not received');
      }
    } catch (error) {
      toast.error(error?.response?.data || 'Login failed');
      dispatch(setUserError(error.message));
    }
  };
};

/* ============================= */
/*            SIGNUP             */
/* ============================= */

export const signUp = (user, navigate) => {
  return async (dispatch) => {
    try {
      await axios.post('/api/v1/auth/register', user);

      toast.success('Registration successful!', { autoClose: 3000 });
      navigate('/loginPage');
    } catch (error) {
      dispatch({
        type: SIGNUP_ERROR,
        payload: error?.response?.data || 'Registration failed',
      });

      toast.error(error?.response?.data || 'Registration failed');
    }
  };
};

/* ============================= */
/*         UPDATE USER           */
/* ============================= */

export const updateUser = (userData) => {
  return async (dispatch) => {
    try {
      const response = await axios.put('/api/v1/auth/updateUser', userData);

      if (response.status === 200) {
        dispatch(userUpdated(response.data));
        dispatch(setUserData(response.data));

        toast.success('Account updated successfully!', {
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error('Error updating account!');
      dispatch(setUserError(error.message));
    }
  };
};

/* ============================= */
/*         FETCH USER DATA       */
/* ============================= */

export const fetchUserData = (userId) => {
  return async (dispatch) => {
    dispatch({ type: FETCH_USER_DATA_START });

    try {
      const response = await axios.get(
        '/api/v1/bankingcore/GetBalanceAndOperations',
        {
          params: {
            identifiant: Number(userId),
          },
        }
      );

      const { balance, transactions } = response.data;

      dispatch({
        type: FETCH_USER_DATA_SUCCESS,
        payload: { balance, transactions },
      });
    } catch (error) {
      dispatch({
        type: FETCH_USER_DATA_FAILURE,
        payload: error.message,
      });
    }
  };
};

/* ============================= */
/*            LOGOUT             */
/* ============================= */

export const logout = (navigate) => {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem('token');

      if (token) {
        await axios.post('/api/v1/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch(clearUserData());
      navigate('/loginPage');
    }
  };
};

/* ============================= */
/*         FUND TRANSFER         */
/* ============================= */

export const handleFundTransfer =
  (sourceAccountId, targetAccountId, amount) =>
  async (dispatch) => {
    try {
      const response = await axios.post(
        '/api/v1/bankingcore/fundTransfer',
        {
          sourceAccountId,
          targetAccountId,
          amount,
        }
      );

      if (response.status === 200) {
        toast.success('Funds transferred successfully!');
        dispatch(fetchUserData(sourceAccountId));
      }
    } catch (error) {
      toast.error(
        error?.response?.data || 'Error transferring funds'
      );
    }
  };

/* ============================= */
/*            COMMENTS           */
/* ============================= */

export const fetchCommentsAction = (userId) => async (dispatch) => {
  try {
    const response = await axios.get(
      `/api/v1/bankingcore/comment/getcomments/${userId}`
    );

    dispatch({
      type: 'FETCH_COMMENTS_SUCCESS',
      payload: response.data,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
};

export const postCommentAction =
  (userId, message) => async (dispatch) => {
    try {
      const response = await axios.post(
        `/api/v1/bankingcore/comment/writecomment/${userId}`,
        { message }
      );

      if (response.status === 200) {
        dispatch(fetchCommentsAction(userId));
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };
