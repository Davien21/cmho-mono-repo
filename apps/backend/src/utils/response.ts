const response = (response: any, data: any, success: boolean) => {
  response = {
    message: response.message ?? response,
    success: success,
    data: data,
  };

  return response;
};

export const successResponse = (message: any, data: any = null) => {
  return response(message, data, true);
};

export const errorResponse = (message: any, data: any = null) => {
  return response(message, data, false);
};
