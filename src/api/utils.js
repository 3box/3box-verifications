export const checkIsFromDashboard = (headers, body) => {
  let domains = /https:\/\/(\w+\.)?(dashboard.3box.io)/i;
  if (domains.test(headers.origin) || domains.test(headers.Origin)) return true;
  if (body.isFromDashboard) return true;

  return false;
}

export const saveClaimToDB = async (userEmailClaim, userDid) => {
  try {
    const requestBody = {
      query: `
      mutation {
        confirmEmail(
          userDid: "${userDid}"
          userEmailClaim: "${userEmailClaim}"
        )
      }`
    };

    const res = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const {
      data,
      errors
    } = await res.json();

    if (res.status !== 200 && res.status !== 201) throw new Error('Failed', res);

    if (!!data) return data;

    return errors;
  } catch (error) {
    console.log('Error in saveClaimToDB: ', error)
  }
};