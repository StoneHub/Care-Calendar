// Site-wide dark mode toggle based on Marietta, SC approximate sunrise/sunset.
(function(){
  const sunsetByMonth = {1:'17:35',2:'18:02',3:'19:23',4:'19:51',5:'20:17',6:'20:35',7:'20:34',8:'20:11',9:'19:31',10:'18:51',11:'17:25',12:'17:17'};
  function shouldDark(){
    try{
      const now=new Date();
      const mm=now.getMonth()+1;
      const s=sunsetByMonth[mm]||'19:00';
      const [sh,sm]=s.split(':').map(x=>parseInt(x,10));
      const sunset=new Date(now); sunset.setHours(sh,sm,0,0);
      const sunrise=new Date(now); sunrise.setHours(6,45,0,0);
      return (now>=sunset || now<sunrise);
    }catch{ return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }
  }
  function apply(){ document.documentElement.classList.toggle('dark', shouldDark()); }
  apply();
  setInterval(apply, 60*1000);
})();
