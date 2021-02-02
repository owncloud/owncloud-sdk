export const parseResponseBody = (response) => {
  const jsonObj = response.clone().json()
  return jsonObj
}

export const getOCSMeta = (response) => {
  return parseResponseBody(response).ocs.meta
}

export const getOCSData = (response) => {
  return parseResponseBody(response).ocs.data
}
