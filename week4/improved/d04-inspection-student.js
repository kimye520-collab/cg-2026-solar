(() => {
  'use strict';
  const viewer=window.InspectionViewer;
  const list=document.querySelector('#tasks');
  const status=document.createElement('p');
  status.className='task-status';
  status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  status.textContent='관찰할 항목을 선택하면 표지가 잘 보이는 시점으로 이동합니다.';
  const progress=document.createElement('p');
  progress.className='task-progress';
  progress.setAttribute('role','status');
  let completed=0;
  function updateProgress(){progress.textContent=`관찰 완료 ${completed}/${viewer.model.tasks.length}`;}
  list.replaceChildren();
  list.before(progress);
  list.after(status);
  updateProgress();

  function focusTask(task){
    viewer.hidden.clear();
    let direction,distance;
    if(task.viewDirection){
      direction=task.viewDirection.map(value=>-value);
      distance=10;
      for(const group of ['structure','site','furniture','equipment','roof','entry'])viewer.hidden.add(group);
    }else{
      direction=[Math.sin(task.yaw),0,Math.cos(task.yaw)];
      distance=task.size[1]/(2*Math.tan(viewer.controls.state.fov*Math.PI/360)*.42);
      distance=Math.max(.45,Math.min(2.8,distance));
    }
    viewer.controls.focus(task.position,direction,distance);
    viewer.render=task.viewDirection
      ?api=>api.drawView({...api.controls.camera(),orthographic:true,halfHeight:3*api.controls.state.distance/10})
      :null;
    status.textContent=task.viewDirection
      ?`${task.id} ${task.name}: ${task.id==='O1'?'전면':'측면'} 직교 뷰입니다. 비교를 위해 건물·부대 설비를 숨겼습니다. 재선택하면 같은 배율·방향으로 초기화되고, 전체 보기나 다른 관찰 항목을 선택하면 구조를 복원합니다.`
      :`${task.id} ${task.name}: 표지 정면 시점으로 이동했습니다. 드래그와 휠로 더 조정할 수 있습니다.`;
  }

  for(const task of viewer.model.tasks){
    const item=document.createElement('li');
    const button=document.createElement('button');
    button.type='button';
    button.className='task-focus';
    button.textContent=`${task.id} ${task.name}`;
    button.addEventListener('click',()=>{
      focusTask(task);
      for(const other of list.querySelectorAll('.task-focus'))other.setAttribute('aria-pressed','false');
      button.setAttribute('aria-pressed','true');
    });
    const description=document.createElement('p');
    description.textContent=task.task;
    const label=document.createElement('label');
    label.className='task-complete';
    const checkbox=document.createElement('input');
    checkbox.type='checkbox';
    checkbox.setAttribute('aria-label',`${task.id} 관찰 완료 표시`);
    checkbox.addEventListener('change',()=>{
      completed+=checkbox.checked?1:-1;
      updateProgress();
    });
    label.append(checkbox,document.createTextNode(' 관찰 완료'));
    item.append(button,description,label);
    list.append(item);
  }
  function restoreHome(){
    viewer.render=null;
    viewer.hidden.clear();
    for(const button of list.querySelectorAll('.task-focus'))button.setAttribute('aria-pressed','false');
    status.textContent='전체 보기로 돌아왔습니다. 숨긴 구조와 설비를 복원했습니다. 관찰한 항목의 완료 상태는 유지됩니다.';
  }
  document.querySelector('#home').addEventListener('click',restoreHome);
  viewer.canvas.addEventListener('keydown',event=>{
    if(event.key==='Home')restoreHome();
  });
})();
