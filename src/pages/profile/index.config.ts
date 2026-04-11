export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '我的',
      enablePullDownRefresh: false
    })
  : { navigationBarTitleText: '我的', enablePullDownRefresh: false }
