export default typeof definePageConfig === 'function'
  ? definePageConfig({
    navigationBarTitleText: '调试页面'
  })
  : { navigationBarTitleText: '调试页面' }
