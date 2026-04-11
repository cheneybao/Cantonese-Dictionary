export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '历史',
      enablePullDownRefresh: true
    })
  : { navigationBarTitleText: '历史', enablePullDownRefresh: true }
