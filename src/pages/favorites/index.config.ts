export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '收藏',
      enablePullDownRefresh: true
    })
  : { navigationBarTitleText: '收藏', enablePullDownRefresh: true }
