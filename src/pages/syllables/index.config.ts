export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '检字',
      enablePullDownRefresh: false
    })
  : { navigationBarTitleText: '检字', enablePullDownRefresh: false }
