export function notFound(_request, response) {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy API yêu cầu.' } });
}

export function errorHandler(error, _request, response, _next) {
  if (error.status && error.status >= 400 && error.status < 500 && !error.type) return response.status(error.status).json({ error: { code: 'REQUEST_ERROR', message: error.message, ...(error.fields?{fields:error.fields}:{}) } });
  if(error.status===503)return response.status(503).json({error:{code:'UNAVAILABLE',message:'Dữ liệu địa chỉ chưa sẵn sàng. Vui lòng thử lại.'}});
  if (error.code === 'P2002') return response.status(409).json({ error: { code: 'CONFLICT', message: 'Dữ liệu đã tồn tại.' } });
  if (error.code === 'P2025') return response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu.' } });
  if (error.code === 'P2003') return response.status(409).json({ error: { code: 'RELATION', message: 'Dữ liệu đang được sử dụng hoặc liên kết không hợp lệ.' } });
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: { code: 'INVALID_JSON', message: 'Nội dung JSON không hợp lệ.' } });
  }
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Dữ liệu yêu cầu quá lớn.' } });
  }
  console.error(error);
  return response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Có lỗi hệ thống. Vui lòng thử lại.' } });
}