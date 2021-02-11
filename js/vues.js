/* global state getQuizzes getUser */

// //////////////////////////////////////////////////////////////////////////////
// HTML : fonctions génération de HTML à partir des données passées en paramètre
// //////////////////////////////////////////////////////////////////////////////

// génération d'une liste de quizzes avec deux boutons en bas
const htmlQuizzesList = (quizzes, curr, total) => {
  console.debug(`@htmlQuizzesList(.., ${curr}, ${total})`);  
  
  // un élement <li></li> pour chaque quizz. Noter qu'on fixe une donnée
  // data-quizzid qui sera accessible en JS via element.dataset.quizzid.
  // On définit aussi .modal-trigger et data-target="id-modal-quizz-menu"
  // pour qu'une fenêtre modale soit affichée quand on clique dessus
  // VOIR https://materializecss.com/modals.html
	quizzesLIst = quizzes.map(
		(q) =>
		`<li class="collection-item modal-trigger cyan lighten-5" data-target="id-modal-quizz-menu" data-quizzid="${q.quiz_id}">
		<h5>${q.title}</h5>
		${q.description} <a class="chip">${q.owner_id}</a>
		</li>`
    );
	
  // le bouton "<" pour revenir à la page précédente, ou rien si c'est la première page
  // on fixe une donnée data-page pour savoir où aller via JS via element.dataset.page
  const prevBtn =
  curr !== 1
  ? `<button id="id-prev-quizzes" data-page="${curr -
    1}" class="btn"><i class="material-icons">navigate_before</i></button>`
    : '';

  // le bouton ">" pour aller à la page suivante, ou rien si c'est la première page
  const nextBtn =
  curr !== total
  ? `<button id="id-next-quizzes" data-page="${curr +
    1}" class="btn"><i class="material-icons">navigate_next</i></button>`
    : '';

  // La liste complète et les deux boutons en bas
  const html = `
  <ul class="collection">
  ${quizzesLIst.join('')}
  </ul>
  <div class="row">      
  <div class="col s6 left-align">${prevBtn}</div>
  <div class="col s6 right-align">${nextBtn}</div>
  </div>
  `;
  return html;
};

// //////////////////////////////////////////////////////////////////////////////
// RENDUS : mise en place du HTML dans le DOM et association des événemets
// //////////////////////////////////////////////////////////////////////////////

// met la liste HTML dans le DOM et associe les handlers aux événements
// eslint-disable-next-line no-unused-vars
function renderQuizzes() {
  console.debug(`@renderQuizzes()`);

	// les éléments à mettre à jour : le conteneur pour la liste des quizz
	const usersElt = document.getElementById('id-all-quizzes-list');
	// une fenêtre modale définie dans le HTML
	const modal = document.getElementById('id-modal-quizz-menu');

	// Contrôle du sélecteur de tris
	quizCopie = state.quizzes.results.slice();
	switch(document.querySelector('.methodeTrisQuiz').value){
		case "Date d'ajout":
			quizCopie.sort(function(a, b){
				return Date(a.created_at)-Date(b.created_at);
			});
			break;
		case "Titre":
			quizCopie.sort(function(a, b){
				return String(a.title).localeCompare(String(b.title));
			});
			break;
		case "Description":
			quizCopie.sort(function(a, b){
				return String(a.description).localeCompare(String(b.description));
			});
			break;
	}
	// Contrôle du nbr max de quiz affichés
	quizCopie.splice(Number(document.querySelector('.nbrQuizAffiche').value));
	// Contrôle de l'affichage croissant ou décroissant
	if(document.querySelector('.ordreTrisQuiz').value == "decroissant"){
		quizCopie.reverse();
	}
	console.log(state.quizzes.results);
	console.log(quizCopie);

  // on appelle la fonction de généraion et on met le HTML produit dans le DOM
  usersElt.innerHTML = htmlQuizzesList(
    quizCopie,
    state.quizzes.currentPage,
    state.quizzes.nbPages
    );

  // /!\ il faut que l'affectation usersElt.innerHTML = ... ait eu lieu pour
  // /!\ que prevBtn, nextBtn et quizzes en soient pas null
  // les éléments à mettre à jour : les boutons
  const prevBtn = document.getElementById('id-prev-quizzes');
  const nextBtn = document.getElementById('id-next-quizzes');
  // la liste de tous les quizzes individuels
  quizzes = document.querySelectorAll('#id-all-quizzes-list li'); 

  // les handlers quand on clique sur "<" ou ">"
  function clickBtnPager() {
    // remet à jour les données de state en demandant la page
    // identifiée dans l'attribut data-page
    // noter ici le 'this' QUI FAIT AUTOMATIQUEMENT REFERENCE
    // A L'ELEMENT AUQUEL ON ATTACHE CE HANDLER
    getQuizzes(this.dataset.page);
  }
  if (prevBtn) prevBtn.onclick = clickBtnPager;
  if (nextBtn) nextBtn.onclick = clickBtnPager;

  // qd on clique sur un quizz, on change sont contenu avant affichage
  // l'affichage sera automatiquement déclenché par materializecss car on
  // a définit .modal-trigger et data-target="id-modal-quizz-menu" dans le HTML
  function clickQuiz() {
    const quizzId = this.dataset.quizzid;
    console.debug(`@clickQuiz(${quizzId})`);
    const addr = `${state.serverUrl}/quizzes/${quizzId}`;

    
    const html = `
    <p>Vous pourriez aller voir <a href="${addr}">${addr}</a>
    ou <a href="${addr}/questions">${addr}/questions</a> pour ses questions<p>.`;
    modal.children[0].innerHTML = html;
    state.currentQuizz = quizzId;
    
    renderCurrentQuizz(addr);
  }

  
  quizzes.forEach((q) => {
    q.onclick = clickQuiz;
  });
}


function renderCurrentQuizz(addr) {
  const main = document.getElementById('form1');
  
  const url = `${addr}/questions`;
  main.innerHTML = `Ici les détails pour le quizz #${state.currentQuizz}`;
  
  fetch(url)
  .then((response) => response.json(console.log(response)))
  .then((question) => {
	  quizzes = quizzes[0];
    afficheQuiz(question, main);
  })
  .catch(() => main.innerHTML += "Erreur le quizz ne contient pas de question");


  const answer = document.getElementById('form1');

  answer.onsubmit = function(ev) {
    ev.preventDefault();

    const formData = new FormData(answer);
    console.debug(formData);
    const data = [];
    for (const pair of formData.entries()) {
      data.push(pair);
    }
    console.log(data);
    data.map((id) => {
      const addr2 = `${addr}/questions/${id[0]}/answers/${id[1]}`;
      fetch(addr2, {
        method: 'POST',
        headers: state.headers(),
        body: JSON.stringify(data),
      })
      .then((r) => r.json(console.log(r)))
    });
    
  }

}

// quand on clique sur le bouton de login, il nous dit qui on est
// eslint-disable-next-line no-unused-vars
const renderUserBtn = () => {
  const btn = document.getElementById('id-login');
  btn.onclick = () => {
    if (state.user) {
      // eslint-disable-next-line no-alert
      const res = confirm(`Bonjour ${state.user.firstname} ${state.user.lastname.toUpperCase()}. Voulez vous vous delogger ?`
        );
      if (res)
        state.xApiKey = '';
      getUser();
    } else {
      // eslint-disable-next-line no-alert
      const saisie = prompt(`Pour vous authentifier, saisir votre x-api-key`);
      state.xApiKey = saisie;
      getUser();
    }
  };
};

// Fonction qui affiche les quizz
function afficheQuiz(question, div) {
  console.log(question);

  question.map(
    (q, i) => {

      div.innerHTML += `<div id="s${i}"> <h6> ${q.sentence} </h6> </div>`;
      q.propositions.map(
        (r, j) => {

          const div2 = document.getElementById(`s${i}`);
          div2.innerHTML +=
          `<p>` +
          `<label for="rep${i}${j}">` +
          `<input name="${i}" type="radio" value="${j}" id="rep${i}${j}">` +
          `<span> ${r.content} </span>` +
          `</label>` +
          `</p>`;
        })
      
    });
  div.innerHTML +=
  `<div class="row center align">` +
  `<button class="btn waves-effect waves-light" type="submit" name="repondre">répondre` +
  `<i class="material-icons right">send</i>` +
  `</outton>` +
  `</div>`;
}

//Pour récupérer les réponses de l'utilisateur
function getResponsesUser(url, div) {


  fetch(url, { method: 'GET', headers: state.headers() })
  .then((response) => response.json(console.log(response)))
  .then((answers) => {

    console.log(answers);
    answers.map((t, j) => {
      div.innerHTML += 
      `<div id="r${j}" class="cyan lighten-5" >` +
      `<p>${t.title}</p>` +
      `</div>`;

      t.answers.map((a) => {
        console.log(t.quiz_id);
        const url2 = `${state.serverUrl}/quizzes/${t.quiz_id}/questions/${a.question_id}`;
        console.log(a.question_id);
        fetch(url2) 
        .then((response) => response.json(console.log(response)))
        .then((question) => {
          document.getElementById("r" + j + "").innerHTML +=
          `<p> ${question.sentence} </p>` + 
          `<p> Votre réponse : </p>` +
          `<p> ${question.propositions[a.proposition_id].content} </p>`; 
        });
      });
    })
  })
  .catch(() => div.innerHTML += "L'utilisateur n'a pas de quizz");
}

// Fonction qui affiche les reponses de l'utilisateur sur la page
function renderUserResponses() {

  const usersElt = document.getElementById('recAns');

  usersElt.innerHTML = "";

  const addrUser = `${state.serverUrl}/users/answers`;

  getResponsesUser(addrUser, usersElt);
}

// Fonction qui ajoute un quiz dans le fichier JSON
function ajoutMyQuiz(url, div) {

  fetch(url, {method: 'GET', headers: state.headers()} )
  .then((response) => response.json(console.log(response)))
  .then((addQuiz) => { 

    addQuiz.map((a, l) => {
      div.innerHTML += `<div id="r${l}" class="green accent-3" >` +
      `<h4>${a.title}</h4>` +
      `<br>` +
      `<h5>${a.description}</h5>` +
      `<p><p>` +

      `<a class="waves-effect waves-light btn"><i class="material-icons right">edit</i>Modifier</a>` +
      `</div>`;

    })


  })
}

// Fonction qui ajoute un quiz dans l'onglet mes quiz via le formulaire
function renderMyQuiz() {

  const usersQuiz = document.getElementById('myQuizz2');

  usersQuiz.innerHTML = "";

  const addrQuiz = `${state.serverUrl}/users/quizzes`;

  ajoutMyQuiz(addrQuiz, usersQuiz);


}

const mesQuiz = document.getElementById('myQuizz');
mesQuiz.onclick = () =>
renderMyQuiz(); // La fonction est appelée des qu'on clique sur le bouton

const recupAns = document.getElementById('myAns');
recupAns.onclick = () => 
renderUserResponses(); // La fonction est appelée des qu'on clique sur le bouton

const creerAns = document.getElementById('creerQuiz');
creerAns.onclick = () => {
  alert("QCM crée !")
}

const recMyQuiz = document.getElementById('formIdQuiz');

recMyQuiz.onsubmit = function(sub) {
  console.log('sub');
  sub.preventDefault();

  const formMyQuiz = new FormData(recMyQuiz);
  console.debug(formMyQuiz);
  const dataQuiz = [];
  for (const pair2 of formMyQuiz.entries()) {
    dataQuiz.push(pair2);
  }
  console.log(dataQuiz);


  const addr2 = `${state.serverUrl}/quizzes/`;
  fetch(addr2, {
    method: 'POST',
    headers: state.headers(),
    body: JSON.stringify({
      title: dataQuiz[0][1],
      description: dataQuiz[1][1]
    })

  })
  .then((r) => r.json(console.log(r)))

 renderMyQuiz();
  
}

// Réaffiche si modification du nbr max de quiz à afficher
selectElement = document.querySelector('.nbrQuizAffiche');
selectElement.addEventListener('change', (event) => {
	renderQuizzes();
});
selectElement = document.querySelector('.methodeTrisQuiz');
selectElement.addEventListener('change', (event2) => {
	renderQuizzes();
});
selectElement = document.querySelector('.ordreTrisQuiz');
selectElement.addEventListener('change', (event3) => {
	renderQuizzes();
});





