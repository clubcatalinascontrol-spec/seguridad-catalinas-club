// EDITAR
tr.querySelector(".edit-btn").addEventListener("click",()=>{
  const id=docSnap.id;
  const pass=prompt("Ingrese contraseña de administración para continuar");
  if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }

  document.getElementById("editUserModal").classList.add("active");
  document.getElementById("editUserL").value=u.L;
  document.getElementById("editUserNombre").value=u.nombre;
  document.getElementById("editUserDni").value=u.dni;
  document.getElementById("editUserTipo").value=u.tipo; // ahora es readonly

  const finalizeBtn=document.getElementById("finalizeEditBtn");
  const cancelBtn=document.getElementById("cancelEditBtn");
  const msgSpan=document.getElementById("editUserMsg");

  finalizeBtn.onclick=async ()=>{
    const newL=document.getElementById("editUserL").value.trim();
    const newNombre=document.getElementById("editUserNombre").value.trim();
    const newDni=document.getElementById("editUserDni").value.trim();
    const tipoFijo=document.getElementById("editUserTipo").value;

    if(!newL||!newNombre||!newDni||!tipoFijo){
      msgSpan.textContent="Faltan datos, por favor complete todos los campos"; return;
    }
    if(!/^\d{1,3}$/.test(newL)||newNombre.length>25||!/^\d{8}$/.test(newDni)){
      msgSpan.textContent="Datos inválidos"; return;
    }

    // Comprobar si DNI existe en otro usuario (pero sin restricción de #L)
    const qDni=query(usuariosRef, where("dni","==",newDni));
    const snapDni=await getDocs(qDni);
    if(!snapDni.empty && snapDni.docs[0].id!==id){
      msgSpan.style.color="red";
      msgSpan.textContent="Este DNI ya existe en otro usuario";
      return;
    }

    try{
      await updateDoc(doc(db,"usuarios",id),{
        L:newL,nombre:newNombre,dni:newDni,tipo:tipoFijo
      });
      msgSpan.style.color="green";
      msgSpan.textContent="Usuario editado con éxito";
      setTimeout(()=>{
        document.getElementById("editUserModal").classList.remove("active");
        msgSpan.textContent=""; msgSpan.style.color="#0a0";
      },1500);
    }catch(err){ console.error(err); msgSpan.textContent="Error editando"; }
  };

  cancelBtn.onclick=()=>{
    document.getElementById("editUserModal").classList.remove("active");
    msgSpan.textContent="";
  };
});
