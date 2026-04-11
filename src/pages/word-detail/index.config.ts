export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '词条详情',
      enablePullDownRefresh: false
    })
  : { navigationBarTitleText: '词条详情', enablePullDownRefresh: false }
