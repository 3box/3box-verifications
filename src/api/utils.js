export const checkIsFromDashboard = (headers, body) => {
  let domains = /https:\/\/(\w+\.)?(dashboard.3box.io)/i;
  console.log('bodybodybody', body.isFromDashboard)
  if (domains.test(headers.origin) || domains.test(headers.Origin)) return true;
  if (body.isFromDashboard) return true;

  return false;
}