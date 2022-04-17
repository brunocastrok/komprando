/*
	KOMPRANDO: aplicativo de lista de compras
	(c) Bruno Castro, 2022
*/

// true = ativa impressão de informações de debug no console
// false = nenhuma impressão no console
const MODO_DEBUG				= false;

// Tipo de inserção de dados
const INPUT_USUARIO				= 0;
const INPUT_LOCALSTORAGE		= 1;

// Operações do LocalStorage
const LE_STORAGE				= 0;
const GRAVA_STORAGE				= 1;
const REMOVE_STORAGE			= 2;

// Códigos do teclado
const TECLA_ENTER				= 13;

// url da imagem placeholder
const IMG_PLACEHOLDER_URL		= "./images/placeholder.gif";

// Elementos HTML
const listaDeCompras			= document.querySelector(".listaDeCompras");
const inputNomeItem				= document.querySelector(".inputNomeItem");
const botaoInserirNome			= document.querySelector(".botaoInserirNome");
const popupDiv					= document.querySelector(".popup");
const botaoPopupInserirPreco	= document.querySelector(".botaoPopupInserirPreco");
const botaoPopupCancelar		= document.querySelector(".botaoPopupCancelar");
const liListaVazia				= document.querySelector("#listaVazia");
const screenMask				= document.querySelector(".screenMask");
const inputPopupPrecoItem		= document.querySelector(".inputPopupPrecoItem");
const spanTotalCompras			= document.querySelector(".valorTotal");
const gifDoItem					= document.querySelector(".gifDoItem");

// Outras variáveis/inicializações
let arrayLista						= []; // itens cadastrados
let itensExibidos					= 0; // itens exibidos na tela
let liAtual;						// <li> da lista de compras que está sendo trabalhado
let totalCompras;					// soma do preço de todos os itens marcados

window.onload = () => {
	if(MODO_DEBUG) { console.log("Aviso\t\t> Modo debug ativado"); }

	limpaInputNome();
	setaTotalCompras(0);
	
	botaoInserirNome.addEventListener("click", () => {
		insereItem(INPUT_USUARIO, inputNomeItem.value);
	});

	inputNomeItem.addEventListener("keydown", (evento) => {
		if(evento.keyCode == TECLA_ENTER) { // enter foi pressionado no campo de texto do nome do item
			insereItem(INPUT_USUARIO, inputNomeItem.value);
		}
	});

	inputPopupPrecoItem.addEventListener("keydown", (evento) => {
		if(evento.keyCode == TECLA_ENTER) { // enter foi pressionado no campo de texto do preço do item
			inserePreco(inputPopupPrecoItem.value);
		}
	});

	botaoPopupInserirPreco.addEventListener("click", () => {
		inserePreco(inputPopupPrecoItem.value);
	});

	botaoPopupCancelar.addEventListener("click", () => {
		liAtual.querySelector("input").checked = false; // desmarca a checkbox do item atual
		liAtual.querySelector("span").className = "itemNaoComprado"; // remove riscado do item atual
		fechaPopupPreco();
	});

	//acessaLocalStorage(REMOVE_STORAGE); // remover comentário para testar limpeza do local storage
	
	acessaLocalStorage(LE_STORAGE);
	inputNomeItem.focus();

	if(MODO_DEBUG){ console.log("Função\t\t> window.onLoad()"); }
};

// limpa a caixa de texto principal com o nome do item a ser inserido
function limpaInputNome() {
	inputNomeItem.value = "";
}

function setaTotalCompras(paramTotal) {
	totalCompras = Number(paramTotal.toFixed(2));
	spanTotalCompras.innerHTML = formataPrecoHTML(totalCompras);
}

function formataPrecoHTML(paramPreco) {
	paramPreco = parseFloat(paramPreco);
	
	let parteInteira = Math.trunc(paramPreco);
	let parteDecimal = (paramPreco + "").split(".")[1];
	
	if(parteDecimal == undefined) {
		parteDecimal = "00";
	}
		
	if(parteDecimal.length === 1) {
		parteDecimal += "0"
	}

	return "<em>R$</em>" + parteInteira + "<em>," + parteDecimal + "</em>";
}

// o paramTipoInsercao indica se a inserção do item é via usuário
// ou se é via localStorage
function insereItem(paramTipoInsercao, paramNomeDoItem, paramComprado, paramPreco) {
	if(paramTipoInsercao === INPUT_USUARIO) {
		const nomeDoItem = inputNomeItem.value.trim(); // remove espaços iniciais e finais
		if(nomeDoItem.length <= 0) {
			alert("Insira um nome válido");
			limpaInputNome();
			inputNomeItem.focus();
			return;
		}

		const novoElemento = {
			nome: paramNomeDoItem,
			comprado: false,
			preco: 0
		};
		
		arrayLista.push(novoElemento);
		acessaLocalStorage(GRAVA_STORAGE);
	}

	liListaVazia.style.display = "none"; // remove <li> contendo mensagem "sua lista está vazia"
	
	liAtual = document.createElement("li");
	
	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.addEventListener("click", () => {
		liAtual = checkbox.parentElement;
		if(checkbox.checked) { // item foi marcado como comprado
			marcaItem();
			mostraPopupPreco();
		} else { // item foi marcado como não-comprado
			desmarcaItem();
		}
	});
	
	const spanNomeDoItem = document.createElement("span");
	spanNomeDoItem.innerText = paramNomeDoItem;
	spanNomeDoItem.className = "itemNaoComprado";

	const strongPrecoDoItem = document.createElement("strong");
	
	if(paramTipoInsercao === INPUT_LOCALSTORAGE) { // se preço foi lido do local storage e fornecido como parâmetro
		strongPrecoDoItem.innerHTML = formataPrecoHTML(paramPreco);
		if (paramComprado) { // item já foi comprado
			strongPrecoDoItem.style.display = "inline";
		} else {
			strongPrecoDoItem.style.display = "none";
		}
	} else {
		strongPrecoDoItem.style.display = "none"; // preço fica invisível até ser definido
		strongPrecoDoItem.innerText = "R$ 0,00";
	}
	
	const botaoExcluir = document.createElement("button");
	botaoExcluir.innerText = "X";
	botaoExcluir.onclick = () => {
		liAtual = botaoExcluir.parentElement;
		removeItem();
	};

	liAtual.append(checkbox);
	liAtual.append(spanNomeDoItem);
	liAtual.append(strongPrecoDoItem);
	liAtual.append(botaoExcluir);
	listaDeCompras.append(liAtual);

	if(paramTipoInsercao === INPUT_LOCALSTORAGE && paramComprado) {
		checkbox.checked = true;
		marcaItem();
	}

	limpaInputNome();
	
	if(paramTipoInsercao === INPUT_LOCALSTORAGE){
		liAtual.id = itensExibidos++; // A id da tag <li> representa a posição do elemento no array da lista de compras
	} else {
		liAtual.id = arrayLista.length - 1;
	}

	liAtual.className = "liAdicionada";
	
	inputNomeItem.focus();

	if(MODO_DEBUG) { console.log("Função\t\t> insereItem()"); }
}

function removeItem() {
	if(arrayLista[liAtual.id].comprado) {
		setaTotalCompras(totalCompras - arrayLista[liAtual.id].preco);
	}

	// remove da matriz o elemento atual
	arrayLista.splice(liAtual.id, 1);

	// remove da tela o elemento atual
	liAtual.remove();

	if(arrayLista.length === 0) { // lista ficou vazia
		liListaVazia.style.display = "block"; // reativa <li> contendo mensagem "sua lista está vazia"
	} else {
		// reordena IDs de todas as LIs
		let idContador = 0;
		document.querySelectorAll(".liAdicionada").forEach(elemento => {
			elemento.id = idContador++;
		});
	}
	
	acessaLocalStorage(GRAVA_STORAGE);
	
	inputNomeItem.focus();

	if(MODO_DEBUG) { console.log("Função\t\t> removeItem()"); }
}

function marcaItem() {
	// risca o nome do item atual
	liAtual.querySelector("span").className = "itemComprado";
}

function desmarcaItem(){
	// se o produto foi comprado, debite o valor dele da lista
	if(arrayLista[liAtual.id].comprado) {
		setaTotalCompras(totalCompras - arrayLista[liAtual.id].preco);
		arrayLista[liAtual.id].comprado = false;
	}

	// remove o risco do nome do item atual
	liAtual.querySelector("span").className = "itemNaoComprado";

	// desmarca a checkbox do item atual
	liAtual.querySelector("input").checked = false;

	// oculta o preço da tela
	liAtual.querySelector("strong").style.display = "none";
	
	acessaLocalStorage(GRAVA_STORAGE);

	inputNomeItem.focus();
}

function mostraPopupPreco() {
	inputPopupPrecoItem.value = arrayLista[liAtual.id].preco;

	if (inputPopupPrecoItem.value == 0) {
		inputPopupPrecoItem.value = "";
	}
	
	// mostra na popup o nome do item atual
	const popupNomeItem = document.querySelector("#popupNomeItem");
	popupNomeItem.innerText = arrayLista[liAtual.id].nome;

	// insere dentro da popup o gif obtido via API
	obtemGif(arrayLista[liAtual.id].nome);
	
	screenMask.style.display = "block"; // mostra camada abaixo da popup mascarando toda a tela
	popupDiv.style.display = "block"; // mostra a popup
	inputPopupPrecoItem.select();

	if(MODO_DEBUG) { console.log("Função\t\t> mostraPopupPreco()"); }
}

function inserePreco(paramPreco) {
	let precoTratado = Number(paramPreco.trim());
	
	if(isNaN(precoTratado) || precoTratado <= 0) {
		alert ("Insira um preço válido");
		inputPopupPrecoItem.value = 0;
		inputPopupPrecoItem.select();
		return;
	}

	precoTratado = Number(parseFloat(precoTratado).toFixed(2));

	// exibe dentro da lista o preço do item ao lado do nome
	let labelPreco = liAtual.querySelector("strong");
	labelPreco.innerHTML = formataPrecoHTML(precoTratado);
	labelPreco.style.display = "inline"; // torna elemento do preço visível
		
	arrayLista[liAtual.id].preco = precoTratado;
	arrayLista[liAtual.id].comprado = true;

	setaTotalCompras(totalCompras + precoTratado);

	fechaPopupPreco();

	acessaLocalStorage(GRAVA_STORAGE);

	inputNomeItem.focus();
	
	if(MODO_DEBUG) { console.log("Função\t\t> inserePreco()"); }
}

function fechaPopupPreco() {
	popupDiv.style.display = "none";
	screenMask.style.display = "none"; // oculta camada abaixo da popup
	inputNomeItem.focus();
	
	if(MODO_DEBUG) { console.log("Função\t\t> fechaPopupPreco()"); }
}

function acessaLocalStorage(paramOperacao) {
	switch (paramOperacao) {
		case LE_STORAGE:
			const leituraJSON = localStorage.getItem("storageListaCompras");

			if(!leituraJSON || leituraJSON.length < 3) { // lista não foi gravada, ou foi gravada matriz vazia
				if(MODO_DEBUG) { console.log("Localstorage\t> leitura retornou vazio"); }
				return;
			}

			totalCompras = 0;

			arrayLista = JSON.parse(leituraJSON);
			arrayLista.forEach(elemento => {
				insereItem(INPUT_LOCALSTORAGE, elemento.nome, elemento.comprado, elemento.preco);
					totalCompras += elemento.comprado ? Number(elemento.preco) : 0;
					totalCompras = Number(totalCompras.toFixed(2));

					if(MODO_DEBUG) { console.log('Localstorage\t> item lido: nome =', elemento.nome, '| comprado =', elemento.comprado, '| preco =', elemento.preco); }
			});

			if(MODO_DEBUG) {
				console.log('Localstorage\t> TotalCompras calculado:', totalCompras);
			}

			setaTotalCompras(totalCompras);
			break;

		case GRAVA_STORAGE:
			if(arrayLista.length == 0) { //se a lista está vazia
				if(MODO_DEBUG) { console.log("Localstorage\t> storage será apagado, porque arrayLista ficou vazia"); }
				acessaLocalStorage(REMOVE_STORAGE);

			} else {
				localStorage.setItem("storageListaCompras", JSON.stringify(arrayLista));
				if(MODO_DEBUG) { console.log("Localstorage\t> Array gravada:", arrayLista); }
			}
			break;

		case REMOVE_STORAGE:
			localStorage.clear();
			if(MODO_DEBUG) { console.log('Localstorage\t> storage limpo'); }

		break;
	}
}

async function obtemGif(paramNome){
	gifDoItem.src = IMG_PLACEHOLDER_URL; // troca a imagem para placeholder provisoriamente

	let urlInicial, fetchResposta, urlFinal;
	urlInicial = "https://api.giphy.com/v1/gifs/search?api_key=dpPu1kIHwa3fxoQiH9lzTfmUkMgEjtuS&q=";
	urlInicial += paramNome;

	try {
		if(MODO_DEBUG) { console.log("Promise try\t> obtemGif()"); }
		fetchResposta = await fetch(urlInicial);
		urlFinal = await fetchResposta.json();
		urlFinal = urlFinal.data[0].images.fixed_width.url;
		gifDoItem.src = urlFinal;
	} catch (erro) {
		if(MODO_DEBUG) { console.log("Promise catch\t> obtemGif()", erro); }
	} finally {
		if(MODO_DEBUG) { console.log("Promise finally\t> obtemGif() // URL =", urlFinal); }
	}
}