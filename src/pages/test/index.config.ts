export default typeof definePageConfig === 'function'
  ? definePageConfig({
    navigationBarTitleText: '部署验证测试'
  })
  : { navigationBarTitleText: '部署验证测试' }
