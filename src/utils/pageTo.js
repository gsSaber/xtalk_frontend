/**
 * @description: 页面跳转
 * @param {object | string} options
 * @param {string} options.url 跳转地址
 * @param {*} options.query 跳转参数
 * @return {*}
 */
export function jumpPageTo(options = {
  url: '',
  query: null,
}) {
  if (typeof options === 'string') {
    const optionsUrl = options
    options = {
      url: optionsUrl,
      query: null,
    }
  }
  if (options.query) {
    options.url += '?'
    for (let key in options.query) {
      options.url += `${key}=${options.query[key]}&`
    }
    options.url = options.url.substring(0, options.url.length - 1)
  }
  uni.navigateTo({
    url: options.url,
  }).then((r) => {
  })
}

/**
 * @description: 页面跳转
 * @param {object | string} options
 * @param {string} options.url 跳转地址
 * @param {*} options.query 跳转参数
 * @return {*}
 */
export function jumpSwitchPageTo(options = {
  url: '',
  query: null,
}) {
  if (typeof options === 'string') {
    const optionsUrl = options
    options = {
      url: optionsUrl,
      query: null,
    }
  }
  if (options.query) {
    options.url += '?'
    for (let key in options.query) {
      options.url += `${key}=${options.query[key]}&`
    }
    options.url = options.url.substring(0, options.url.length - 1)
  }
  uni.switchTab({
    url: options.url,
  }).then((r) => {
  })
}

/**
 * @description: 页面返回
 */
export function jumpPageBack(options = {
  delta: 1,
}) {
  console.log(options, 'options')
  uni.navigateBack({
    delta: options.delta || 1,
  }).then((r) => {
  })
}
