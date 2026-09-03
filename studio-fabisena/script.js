"use strict";


const service =
    document.getElementById("service");

const date =
    document.getElementById("date");

const nameInput =
    document.getElementById("name");

const phoneInput =
    document.getElementById("phone");

const times =
    document.querySelectorAll(".time");

const customTimeContainer =
    document.getElementById("customTimeContainer");

const customTime =
    document.getElementById("customTime");

const availability =
    document.getElementById("availability");

const bookButton =
    document.getElementById("bookButton");

const message =
    document.getElementById("message");

const website =
    document.getElementById("website");

const clearCustomerData =
    document.getElementById("clearCustomerData");


let selectedTime = null;

let occupiedTimes = [];


/*
 * CHAVE DOS DADOS SALVOS
 *
 * Esses dados ficam somente
 * no navegador da cliente.
 */
const CUSTOMER_STORAGE_KEY =
    "studio_fabiana_sena_cliente";


/*
 * DATA DE HOJE
 */
function getToday() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/*
 * HORA ATUAL
 */
function getCurrentTime() {

    const now =
        new Date();

    const hours =
        String(now.getHours())
            .padStart(2, "0");

    const minutes =
        String(now.getMinutes())
            .padStart(2, "0");

    return `${hours}:${minutes}`;
}


/*
 * Verifica se o horário
 * já passou hoje.
 */
function isPastTime(
    selectedDate,
    selectedTime
) {

    if (
        selectedDate !== getToday()
    ) {

        return false;

    }

    return (
        selectedTime <=
        getCurrentTime()
    );

}


/*
 * Data mínima = hoje
 */
date.min =
    getToday();


/*
 * MENSAGENS
 */
function showMessage(
    text,
    type = "error"
) {

    message.textContent =
        text;

    message.className =
        `message show ${type}`;

}


/*
 * LIMPA MENSAGEM
 */
function clearMessage() {

    message.textContent =
        "";

    message.className =
        "message";

}


/*
 * SALVA DADOS DA CLIENTE
 *
 * Fica somente neste navegador.
 */
function saveCustomerData() {

    const customerName =
        nameInput.value.trim();

    const customerPhone =
        phoneInput.value.trim();


    /*
     * Só salva quando existe
     * alguma informação.
     */
    if (
        !customerName &&
        !customerPhone
    ) {

        return;

    }


    try {

        localStorage.setItem(

            CUSTOMER_STORAGE_KEY,

            JSON.stringify({

                name:
                    customerName,

                phone:
                    customerPhone

            })

        );

    } catch (error) {

        console.warn(
            "Não foi possível salvar os dados no navegador.",
            error
        );

    }

}


/*
 * CARREGA DADOS SALVOS
 */
function loadCustomerData() {

    try {

        const saved =
            localStorage.getItem(
                CUSTOMER_STORAGE_KEY
            );


        if (!saved) {

            return;

        }


        const customer =
            JSON.parse(saved);


        if (
            customer &&
            typeof customer.name === "string"
        ) {

            nameInput.value =
                customer.name;

        }


        if (
            customer &&
            typeof customer.phone === "string"
        ) {

            phoneInput.value =
                customer.phone;

        }

    } catch (error) {

        console.warn(
            "Não foi possível carregar os dados salvos.",
            error
        );

    }

}


/*
 * LIMPA DADOS SALVOS
 */
function clearSavedCustomerData() {

    try {

        localStorage.removeItem(
            CUSTOMER_STORAGE_KEY
        );

    } catch (error) {

        console.warn(
            "Não foi possível limpar os dados.",
            error
        );

    }


    nameInput.value =
        "";

    phoneInput.value =
        "";


    showMessage(
        "Seus dados salvos foram apagados.",
        "success"
    );

}


/*
 * CARREGA OS DADOS
 * assim que a página abre.
 */
loadCustomerData();


/*
 * SALVA NOME ENQUANTO DIGITA.
 */
nameInput.addEventListener(
    "input",
    () => {

        nameInput.value =
            nameInput.value
                .replace(
                    /[\u0000-\u001F\u007F]/g,
                    ""
                )
                .slice(0, 80);


        saveCustomerData();

    }
);


/*
 * TELEFONE
 */
phoneInput.addEventListener(
    "input",
    () => {

        phoneInput.value =
            phoneInput.value
                .replace(
                    /[^\d+()\-\s]/g,
                    ""
                )
                .slice(0, 20);


        saveCustomerData();

    }
);


/*
 * BOTÃO PARA APAGAR DADOS
 */
if (clearCustomerData) {

    clearCustomerData.addEventListener(
        "click",
        clearSavedCustomerData
    );

}


/*
 * SELECIONAR HORÁRIO
 */
times.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            if (
                button.disabled ||
                button.classList.contains(
                    "unavailable"
                )
            ) {

                return;

            }


            const buttonTime =
                button.dataset.time;


            /*
             * Não permite selecionar
             * horário que já passou.
             */
            if (
                buttonTime !== "OUTRO" &&
                isPastTime(
                    date.value,
                    buttonTime
                )
            ) {

                showMessage(
                    "Esse horário já passou. Escolha outro horário."
                );

                return;

            }


            times.forEach(item => {

                item.classList.remove(
                    "selected"
                );

            });


            button.classList.add(
                "selected"
            );


            selectedTime =
                buttonTime;


            if (
                selectedTime === "OUTRO"
            ) {

                customTimeContainer
                    .classList
                    .remove("hidden");

            } else {

                customTimeContainer
                    .classList
                    .add("hidden");

                customTime.value =
                    "";

            }


            clearMessage();

        }
    );

});


/*
 * BUSCA DISPONIBILIDADE
 */
async function loadAvailability() {

    if (!date.value) {

        availability.textContent =
            "Selecione uma data.";

        return;

    }


    availability.textContent =
        "Verificando disponibilidade...";


    times.forEach(button => {

        button.disabled =
            false;

        button.classList.remove(
            "unavailable",
            "selected"
        );

    });


    selectedTime =
        null;


    customTimeContainer
        .classList
        .add("hidden");


    customTime.value =
        "";


    try {

        const response =
            await fetch(

                `/api/availability?date=${encodeURIComponent(
                    date.value
                )}`,

                {

                    method:
                        "GET",

                    headers: {

                        "Accept":
                            "application/json"

                    },

                    cache:
                        "no-store"

                }

            );


        if (!response.ok) {

            throw new Error(
                "Falha ao consultar disponibilidade."
            );

        }


        const data =
            await response.json();


        occupiedTimes =
            Array.isArray(
                data.occupied
            )
                ? data.occupied
                : [];


        let availableCount =
            0;


        times.forEach(button => {

            const time =
                button.dataset.time;


            if (
                time === "OUTRO"
            ) {

                return;

            }


            /*
             * Horário já reservado.
             */
            const isOccupied =
                occupiedTimes.includes(
                    time
                );


            /*
             * Horário já passado hoje.
             */
            const isPast =
                isPastTime(
                    date.value,
                    time
                );


            if (
                isOccupied ||
                isPast
            ) {

                button.disabled =
                    true;

                button.classList.add(
                    "unavailable"
                );


            } else {

                availableCount++;

            }

        });


        /*
         * Mensagem de disponibilidade.
         */
        if (
            availableCount === 0
        ) {

            availability.textContent =
                "Os horários principais deste dia estão preenchidos ou já passaram. Você pode solicitar outro horário.";

        } else {

            availability.textContent =
                `${availableCount} horário(s) disponível(is).`;

        }


    } catch (error) {

        console.error(
            error
        );


        availability.textContent =
            "Não foi possível consultar os horários. Tente novamente.";

    }

}


/*
 * ATUALIZA QUANDO A DATA MUDA
 */
date.addEventListener(
    "change",
    loadAvailability
);


/*
 * Quando a página volta a ficar ativa,
 * atualiza os horários.
 *
 * Isso é importante se a cliente
 * deixar a página aberta por algumas horas.
 */
document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden &&
            date.value
        ) {

            loadAvailability();

        }

    }
);


/*
 * Atualiza a disponibilidade
 * periodicamente.
 *
 * A cada 60 segundos.
 */
setInterval(
    () => {

        if (
            date.value
        ) {

            loadAvailability();

        }

    },
    60000
);


/*
 * AGENDAMENTO
 */
bookButton.addEventListener(
    "click",
    async () => {

        clearMessage();


        /*
         * Honeypot
         */
        if (
            website.value.trim() !== ""
        ) {

            showMessage(
                "Não foi possível realizar o agendamento."
            );

            return;

        }


        const selectedService =
            service.value.trim();


        const selectedDate =
            date.value.trim();


        const customerName =
            nameInput.value.trim();


        const customerPhone =
            phoneInput.value.trim();


        /*
         * VALIDA SERVIÇO
         */
        if (!selectedService) {

            showMessage(
                "Escolha um serviço."
            );

            return;

        }


        /*
         * VALIDA DATA
         */
        if (!selectedDate) {

            showMessage(
                "Escolha uma data."
            );

            return;

        }


        /*
         * VALIDA HORÁRIO
         */
        if (!selectedTime) {

            showMessage(
                "Escolha um horário."
            );

            return;

        }


        let finalTime =
            selectedTime;


        /*
         * OUTRO HORÁRIO
         */
        if (
            selectedTime === "OUTRO"
        ) {

            finalTime =
                customTime.value.trim();


            if (!finalTime) {

                showMessage(
                    "Informe o horário desejado."
                );

                return;

            }

        }


        /*
         * Validação básica
         * do formato da hora.
         */
        if (
            !/^\d{2}:\d{2}$/.test(
                finalTime
            )
        ) {

            showMessage(
                "Informe um horário válido."
            );

            return;

        }


        /*
         * Não permite horário passado.
         */
        if (
            isPastTime(
                selectedDate,
                finalTime
            )
        ) {

            showMessage(
                "Esse horário já passou. Escolha outro horário."
            );

            await loadAvailability();

            return;

        }


        /*
         * VALIDA NOME
         */
        if (
            customerName.length < 2
        ) {

            showMessage(
                "Digite seu nome completo."
            );

            return;

        }


        /*
         * VALIDA WHATSAPP
         */
        const phoneDigits =
            customerPhone.replace(
                /\D/g,
                ""
            );


        if (
            phoneDigits.length < 10 ||
            phoneDigits.length > 13
        ) {

            showMessage(
                "Digite um WhatsApp válido."
            );

            return;

        }


        /*
         * CONFIRMA DATA
         */
        if (
            selectedDate <
            getToday()
        ) {

            showMessage(
                "Não é possível escolher uma data passada."
            );

            return;

        }


        /*
         * BLOQUEIA HORÁRIO FIXO
         * que já foi carregado como ocupado.
         */
        if (
            selectedTime !== "OUTRO" &&
            occupiedTimes.includes(
                finalTime
            )
        ) {

            showMessage(
                "Esse horário acabou de ser ocupado. Atualize os horários e escolha outro."
            );

            await loadAvailability();

            return;

        }


        /*
         * Salva novamente os dados
         * antes de enviar.
         */
        saveCustomerData();


        bookButton.disabled =
            true;


        bookButton.textContent =
            "Enviando...";


        try {

            const response =
                await fetch(
                    "/api/book",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                service:
                                    selectedService,

                                date:
                                    selectedDate,

                                time:
                                    finalTime,

                                name:
                                    customerName,

                                phone:
                                    customerPhone,

                                customTime:
                                    selectedTime ===
                                    "OUTRO"

                            })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(

                    data.message ||
                    "Não foi possível realizar o agendamento."

                );

            }


            /*
             * Atualiza a disponibilidade
             * imediatamente.
             */
            await loadAvailability();


            showMessage(

                "Agendamento registrado! Você será direcionada ao WhatsApp para aguardar a confirmação da Fabi.",

                "success"

            );


            /*
             * WhatsApp.
             */
            if (
                data.whatsappUrl
            ) {

                setTimeout(
                    () => {

                        window.location.href =
                            data.whatsappUrl;

                    },
                    500
                );

            }


        } catch (error) {

            console.error(
                error
            );


            showMessage(

                error.message ||
                "Erro ao realizar o agendamento."

            );


            /*
             * Atualiza a disponibilidade
             * caso tenha ocorrido conflito.
             */
            await loadAvailability();


        } finally {

            bookButton.disabled =
                false;

            bookButton.textContent =
                "Agendar pelo WhatsApp";

        }

    }
);
