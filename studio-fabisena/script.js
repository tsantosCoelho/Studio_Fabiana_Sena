"use strict";


/*
 * ==========================================
 * CONFIGURAÇÕES
 * ==========================================
 */

const API_AVAILABILITY =
    "/api/availability";

const API_BOOK =
    "/api/book";


const FIXED_TIMES = [
    "09:00",
    "13:00",
    "16:00"
];


const OPEN_TIME =
    "09:00";


const LUNCH_START =
    "12:00";


const LUNCH_END =
    "13:00";


const CLOSE_TIME =
    "19:00";


const CUSTOMER_STORAGE_KEY =
    "studio_fabiana_sena_cliente";


/*
 * ==========================================
 * ELEMENTOS
 * ==========================================
 */

const serviceElement =
    document.getElementById("service");


const dateElement =
    document.getElementById("date");


const availabilityElement =
    document.getElementById("availability");


const timesContainer =
    document.getElementById("times");


const timeButtons =
    document.querySelectorAll(".time");


const customTimeContainer =
    document.getElementById("customTimeContainer");


const customTimeElement =
    document.getElementById("customTime");


const customTimeMessage =
    document.getElementById("customTimeMessage");


const nameElement =
    document.getElementById("name");


const phoneElement =
    document.getElementById("phone");


const clearCustomerDataButton =
    document.getElementById("clearCustomerData");


const bookButton =
    document.getElementById("bookButton");


const messageElement =
    document.getElementById("message");


const honeypotElement =
    document.getElementById("website");


/*
 * ==========================================
 * ESTADO
 * ==========================================
 */

let occupiedTimes = [];

let selectedTime = "";

let selectedDate = "";

let availabilityLoading = false;


/*
 * ==========================================
 * INICIALIZAÇÃO
 * ==========================================
 */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setMinimumDate();

        loadCustomerData();

        setupEvents();

        resetTimes();

    }
);


/*
 * ==========================================
 * EVENTOS
 * ==========================================
 */

function setupEvents() {

    dateElement.addEventListener(
        "change",
        async () => {

            selectedDate =
                dateElement.value;

            selectedTime = "";

            customTimeElement.value = "";

            hideCustomTime();

            clearMessage();

            clearCustomTimeMessage();

            resetTimes();

            if (!selectedDate) {

                availabilityElement.textContent =
                    "Selecione uma data.";

                return;
            }

            await loadAvailability(
                selectedDate
            );

        }
    );


    serviceElement.addEventListener(
        "change",
        () => {

            clearMessage();

        }
    );


    timeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    handleTimeSelection(
                        button
                    );

                }
            );

        }
    );


    customTimeElement.addEventListener(
        "input",
        () => {

            checkCustomTime();

        }
    );


    customTimeElement.addEventListener(
        "change",
        () => {

            checkCustomTime();

        }
    );


    nameElement.addEventListener(
        "input",
        saveCustomerData
    );


    phoneElement.addEventListener(
        "input",
        saveCustomerData
    );


    clearCustomerDataButton.addEventListener(
        "click",
        clearCustomerData
    );


    bookButton.addEventListener(
        "click",
        createBooking
    );


    /*
     * Atualiza a disponibilidade quando
     * o usuário volta para a página.
     */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "visible" &&
                dateElement.value
            ) {

                loadAvailability(
                    dateElement.value
                );

            }

        }
    );


    /*
     * Atualiza a disponibilidade
     * a cada 60 segundos.
     */

    setInterval(
        () => {

            if (
                dateElement.value &&
                !availabilityLoading
            ) {

                loadAvailability(
                    dateElement.value
                );

            }

        },
        60000
    );

}


/*
 * ==========================================
 * DATA MÍNIMA
 * ==========================================
 */

function setMinimumDate() {

    const today =
        getTodayLocal();

    dateElement.min =
        today;

}


/*
 * ==========================================
 * DATA LOCAL
 * ==========================================
 */

function getTodayLocal() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


/*
 * ==========================================
 * CARREGAR DISPONIBILIDADE
 * ==========================================
 */

async function loadAvailability(date) {

    availabilityLoading = true;

    availabilityElement.textContent =
        "Consultando disponibilidade...";


    try {

        /*
         * O timestamp evita cache.
         */

        const url =
            API_AVAILABILITY +
            "?date=" +
            encodeURIComponent(date) +
            "&_=" +
            Date.now();


        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json",

                        "Cache-Control":
                            "no-cache"
                    },

                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Não foi possível consultar os horários."
            );

        }


        /*
         * Normaliza e remove duplicados.
         */

        occupiedTimes =
            Array.isArray(data.occupied)
                ? [
                    ...new Set(
                        data.occupied
                            .map(
                                normalizeTime
                            )
                            .filter(Boolean)
                    )
                ]
                : [];


        /*
         * Se o usuário estava com
         * um horário selecionado,
         * verifica se ainda está livre.
         */

        if (
            selectedTime &&
            isTimeOccupied(
                selectedTime
            )
        ) {

            selectedTime = "";

            customTimeElement.value = "";

            hideCustomTime();

            showMessage(
                "Esse horário acabou de ser ocupado. Escolha outro horário.",
                "error"
            );

        }


        renderTimes();


        /*
         * Quantidade de horários fixos
         * disponíveis.
         */

        const fixedAvailable =
            FIXED_TIMES.filter(
                time =>
                    !isTimeOccupied(time) &&
                    !isPastDateTime(
                        date,
                        time
                    )
            ).length;


        if (
            fixedAvailable === 0
        ) {

            availabilityElement.textContent =
                "Os horários principais deste dia estão ocupados. Você pode verificar a opção \"Outro horário\".";

        } else {

            availabilityElement.textContent =
                "Horários disponíveis atualizados.";

        }


        /*
         * Se "Outro horário" estava
         * selecionado, verifica novamente.
         */

        if (
            selectedTime &&
            !FIXED_TIMES.includes(
                selectedTime
            )
        ) {

            checkCustomTime();

        }


    } catch (error) {

        console.error(
            "Erro ao consultar disponibilidade:",
            error
        );


        occupiedTimes = [];


        availabilityElement.textContent =
            "Não foi possível consultar a disponibilidade. Tente novamente.";


        renderTimes();

    } finally {

        availabilityLoading = false;

    }

}


/*
 * ==========================================
 * RENDERIZAR HORÁRIOS
 * ==========================================
 */

function renderTimes() {

    timeButtons.forEach(
        button => {

            const time =
                button.dataset.time;


            /*
             * OUTRO HORÁRIO
             */

            if (
                time === "OUTRO"
            ) {

                button.disabled =
                    false;

                button.classList.remove(
                    "occupied"
                );

                return;

            }


            const occupied =
                isTimeOccupied(
                    time
                );


            const past =
                dateElement.value
                    ? isPastDateTime(
                        dateElement.value,
                        time
                    )
                    : false;


            button.disabled =
                occupied ||
                past;


            button.classList.toggle(
                "occupied",
                occupied
            );


            button.classList.toggle(
                "selected",
                selectedTime === time
            );


            /*
             * Texto visual
             */

            if (occupied) {

                button.textContent =
                    time +
                    " - Ocupado";

            } else if (past) {

                button.textContent =
                    time +
                    " - Encerrado";

            } else {

                button.textContent =
                    time;

            }

        }
    );

}


/*
 * ==========================================
 * SELECIONAR HORÁRIO
 * ==========================================
 */

function handleTimeSelection(button) {

    if (
        button.disabled
    ) {

        return;
    }


    const time =
        button.dataset.time;


    clearMessage();

    clearCustomTimeMessage();


    /*
     * OUTRO HORÁRIO
     */

    if (
        time === "OUTRO"
    ) {

        selectedTime = "";

        showCustomTime();

        renderTimes();

        customTimeElement.focus();

        return;

    }


    /*
     * HORÁRIO FIXO
     */

    if (
        isTimeOccupied(time)
    ) {

        showMessage(
            "Esse horário já está ocupado. Escolha outro horário.",
            "error"
        );

        return;

    }


    if (
        !dateElement.value
    ) {

        showMessage(
            "Primeiro escolha uma data.",
            "error"
        );

        return;

    }


    if (
        isPastDateTime(
            dateElement.value,
            time
        )
    ) {

        showMessage(
            "Esse horário já passou. Escolha outro horário.",
            "error"
        );

        return;

    }


    selectedTime =
        time;


    hideCustomTime();

    customTimeElement.value = "";

    renderTimes();

}


/*
 * ==========================================
 * OUTRO HORÁRIO
 * ==========================================
 */

function showCustomTime() {

    customTimeContainer.classList.remove(
        "hidden"
    );

}


function hideCustomTime() {

    customTimeContainer.classList.add(
        "hidden"
    );

}


/*
 * ==========================================
 * VERIFICAR OUTRO HORÁRIO
 * ==========================================
 */

function checkCustomTime() {

    const time =
        normalizeTime(
            customTimeElement.value
        );


    clearMessage();


    if (!time) {

        selectedTime = "";

        clearCustomTimeMessage();

        return false;

    }


    /*
     * Verifica formato.
     */

    if (
        !/^\d{2}:\d{2}$/.test(time)
    ) {

        selectedTime = "";

        showCustomTimeMessage(
            "Informe um horário válido.",
            "error"
        );

        return false;

    }


    /*
     * Horário de funcionamento:
     *
     * 09:00 até 19:00.
     *
     * 19:00 é o encerramento,
     * portanto não pode ser início
     * de atendimento.
     */

    if (
        time < OPEN_TIME ||
        time >= CLOSE_TIME
    ) {

        selectedTime = "";

        showCustomTimeMessage(
            "O horário de atendimento é das 09:00 às 19:00. Escolha um horário dentro desse período.",
            "error"
        );

        return false;

    }


    /*
     * Pausa para almoço.
     */

    if (
        time >= LUNCH_START &&
        time < LUNCH_END
    ) {

        selectedTime = "";

        showCustomTimeMessage(
            "Entre 12:00 e 13:00 é o horário de almoço. Escolha outro horário.",
            "error"
        );

        return false;

    }


    /*
     * Verifica se já está ocupado.
     *
     * ESSA É A PARTE PRINCIPAL
     * DA CORREÇÃO.
     */

    if (
        isTimeOccupied(time)
    ) {

        selectedTime = "";

        showCustomTimeMessage(
            "⚠️ Esse horário já está agendado. Escolha outro horário.",
            "error"
        );

        return false;

    }


    /*
     * Verifica se o horário já passou.
     */

    if (
        dateElement.value &&
        isPastDateTime(
            dateElement.value,
            time
        )
    ) {

        selectedTime = "";

        showCustomTimeMessage(
            "Esse horário já passou. Escolha outro horário.",
            "error"
        );

        return false;

    }


    /*
     * Tudo certo.
     */

    selectedTime =
        time;


    showCustomTimeMessage(
        "✓ Horário disponível para solicitação.",
        "success"
    );


    return true;

}


/*
 * ==========================================
 * VERIFICAR HORÁRIO OCUPADO
 * ==========================================
 */

function isTimeOccupied(time) {

    const normalized =
        normalizeTime(time);


    if (!normalized) {

        return false;

    }


    return occupiedTimes.includes(
        normalized
    );

}


/*
 * ==========================================
 * NORMALIZAR HORÁRIO
 * ==========================================
 */

function normalizeTime(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const text =
        String(value)
            .trim();


    /*
     * HH:mm
     */

    let match =
        text.match(
            /^(\d{1,2}):(\d{2})$/
        );


    if (match) {

        const hours =
            Number(
                match[1]
            );

        const minutes =
            Number(
                match[2]
            );


        if (
            hours >= 0 &&
            hours <= 23 &&
            minutes >= 0 &&
            minutes <= 59
        ) {

            return (
                String(hours)
                    .padStart(2, "0") +
                ":" +
                String(minutes)
                    .padStart(2, "0")
            );

        }

    }


    return "";

}


/*
 * ==========================================
 * HORÁRIO PASSADO
 * ==========================================
 */

function isPastDateTime(
    date,
    time
) {

    const today =
        getTodayLocal();


    if (
        date < today
    ) {

        return true;

    }


    if (
        date > today
    ) {

        return false;

    }


    const normalized =
        normalizeTime(time);


    if (!normalized) {

        return false;

    }


    const now =
        new Date();


    const currentHours =
        now.getHours();


    const currentMinutes =
        now.getMinutes();


    const currentTotal =
        currentHours * 60 +
        currentMinutes;


    const parts =
        normalized.split(":");


    const selectedHours =
        Number(
            parts[0]
        );


    const selectedMinutes =
        Number(
            parts[1]
        );


    const selectedTotal =
        selectedHours * 60 +
        selectedMinutes;


    return (
        selectedTotal <=
        currentTotal
    );

}


/*
 * ==========================================
 * RESETAR HORÁRIOS
 * ==========================================
 */

function resetTimes() {

    occupiedTimes = [];

    selectedTime = "";

    renderTimes();

}


/*
 * ==========================================
 * CRIAR AGENDAMENTO
 * ==========================================
 */

async function createBooking() {

    clearMessage();


    /*
     * Honeypot
     */

    if (
        honeypotElement &&
        honeypotElement.value.trim() !== ""
    ) {

        return;

    }


    const service =
        serviceElement.value.trim();


    const date =
        dateElement.value.trim();


    const name =
        nameElement.value.trim();


    const phone =
        phoneElement.value.trim();


    /*
     * SERVIÇO
     */

    if (!service) {

        showMessage(
            "Selecione um serviço.",
            "error"
        );

        serviceElement.focus();

        return;

    }


    /*
     * DATA
     */

    if (!date) {

        showMessage(
            "Selecione uma data.",
            "error"
        );

        dateElement.focus();

        return;

    }


    /*
     * DATA PASSADA
     */

    if (
        date < getTodayLocal()
    ) {

        showMessage(
            "Não é possível agendar para uma data que já passou.",
            "error"
        );

        dateElement.focus();

        return;

    }


    /*
     * HORÁRIO
     */

    if (
        !selectedTime
    ) {

        showMessage(
            "Escolha um horário.",
            "error"
        );

        return;

    }


    /*
     * Se for horário personalizado,
     * verifica novamente.
     */

    const isCustomTime =
        !FIXED_TIMES.includes(
            selectedTime
        );


    if (
        isCustomTime
    ) {

        const valid =
            checkCustomTime();


        if (!valid) {

            customTimeElement.focus();

            return;

        }

    }


    /*
     * Verificação final contra
     * a disponibilidade carregada.
     */

    if (
        isTimeOccupied(
            selectedTime
        )
    ) {

        showMessage(
            "⚠️ Esse horário já foi ocupado. Atualize a disponibilidade e escolha outro horário.",
            "error"
        );


        await loadAvailability(
            date
        );


        return;

    }


    /*
     * HORÁRIO PASSADO
     */

    if (
        isPastDateTime(
            date,
            selectedTime
        )
    ) {

        showMessage(
            "Esse horário já passou. Escolha outro horário.",
            "error"
        );

        await loadAvailability(
            date
        );

        return;

    }


    /*
     * NOME
     */

    if (
        name.length < 2
    ) {

        showMessage(
            "Digite seu nome.",
            "error"
        );

        nameElement.focus();

        return;

    }


    /*
     * WhatsApp
     */

    const phoneDigits =
        phone.replace(
            /\D/g,
            ""
        );


    if (
        phoneDigits.length < 10 ||
        phoneDigits.length > 13
    ) {

        showMessage(
            "Digite um WhatsApp válido.",
            "error"
        );

        phoneElement.focus();

        return;

    }


    /*
     * DESABILITA BOTÃO
     */

    bookButton.disabled =
        true;

    bookButton.textContent =
        "Enviando...";


    try {

        const payload = {

            service,

            date,

            time:
                selectedTime,

            name,

            phone,

            customTime:
                isCustomTime

        };


        const response =
            await fetch(
                API_BOOK,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const data =
            await response.json();


        /*
         * BACKEND RECUSOU
         */

        if (
            !response.ok ||
            !data.success
        ) {

            const errorMessage =
                data.message ||
                "Não foi possível realizar o agendamento.";


            showMessage(
                errorMessage,
                "error"
            );


            /*
             * Atualiza disponibilidade
             * caso tenha sido ocupado
             * por outra pessoa.
             */

            await loadAvailability(
                date
            );


            return;

        }


        /*
         * SUCESSO
         */

        showMessage(
            data.message ||
            "Agendamento realizado com sucesso!",
            "success"
        );


        /*
         * Adiciona o horário localmente
         * como ocupado imediatamente.
         */

        if (
            selectedTime &&
            !occupiedTimes.includes(
                selectedTime
            )
        ) {

            occupiedTimes.push(
                selectedTime
            );

        }


        renderTimes();


        /*
         * Abre WhatsApp.
         */

        if (
            data.whatsappUrl
        ) {

            window.location.href =
                data.whatsappUrl;

        }


    } catch (error) {

        console.error(
            "Erro ao realizar agendamento:",
            error
        );


        showMessage(
            "Não foi possível realizar o agendamento. Verifique sua conexão e tente novamente.",
            "error"
        );


    } finally {

        bookButton.disabled =
            false;

        bookButton.textContent =
            "Agendar pelo WhatsApp";

    }

}


/*
 * ==========================================
 * MENSAGENS
 * ==========================================
 */

function showMessage(
    text,
    type
) {

    messageElement.textContent =
        text;


    messageElement.className =
        "message " +
        type;

}


function clearMessage() {

    messageElement.textContent =
        "";

    messageElement.className =
        "message";

}


function showCustomTimeMessage(
    text,
    type
) {

    customTimeMessage.textContent =
        text;


    customTimeMessage.className =
        "custom-time-message " +
        type;

}


function clearCustomTimeMessage() {

    customTimeMessage.textContent =
        "";

    customTimeMessage.className =
        "custom-time-message";

}


/*
 * ==========================================
 * LOCALSTORAGE
 * ==========================================
 */

function saveCustomerData() {

    const data = {

        name:
            nameElement.value.trim(),

        phone:
            phoneElement.value.trim()

    };


    try {

        localStorage.setItem(
            CUSTOMER_STORAGE_KEY,
            JSON.stringify(data)
        );

    } catch (error) {

        console.error(
            "Não foi possível salvar os dados:",
            error
        );

    }

}


function loadCustomerData() {

    try {

        const saved =
            localStorage.getItem(
                CUSTOMER_STORAGE_KEY
            );


        if (!saved) {

            return;

        }


        const data =
            JSON.parse(saved);


        if (
            data &&
            typeof data.name ===
                "string"
        ) {

            nameElement.value =
                data.name;

        }


        if (
            data &&
            typeof data.phone ===
                "string"
        ) {

            phoneElement.value =
                data.phone;

        }


    } catch (error) {

        console.error(
            "Não foi possível carregar os dados:",
            error
        );

    }

}


/*
 * ==========================================
 * LIMPAR DADOS
 * ==========================================
 */

function clearCustomerData() {

    nameElement.value =
        "";

    phoneElement.value =
        "";


    try {

        localStorage.removeItem(
            CUSTOMER_STORAGE_KEY
        );

    } catch (error) {

        console.error(
            "Não foi possível limpar os dados:",
            error
        );

    }


    showMessage(
        "Seus dados foram apagados.",
        "success"
    );

}
