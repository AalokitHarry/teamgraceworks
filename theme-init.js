(function(){
  try{
    var stored = localStorage.getItem('tgw-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }catch(e){}
})();
