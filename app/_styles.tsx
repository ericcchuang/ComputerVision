import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    cameraContainer: {
        flex: 10,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },

    busNumberContainer: {
        flex: 4,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        paddingVertical: 15,
        paddingHorizontal: 20
    },

    text: {
        fontSize: 14,
        fontFamily: "Arial",
        marginVertical: 2
    },

    subtitle: {
        fontSize: 14,
        fontFamily: "Arial",
        marginVertical: 2,
        fontWeight: "bold",
        color: "#666"
    },

    titleText: {
        fontWeight: "bold",
        fontFamily: "Arial",
        fontSize: 18,
        marginVertical: 2
    },

    wheelchair: {
        flexDirection: "row",
        alignContent: "center",
        justifyContent: "center",
        borderColor: "blue",
        marginVertical: 5,
    },

    webSlider: {
        display: "flex",
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
        marginBottom: 8,
    },

    textInput: {
        padding: 10,
        borderColor: "#000",
        borderWidth: 2,
        width: 72,
        marginRight: 8,
        borderRadius: 10,
        fontSize: 16
    },

    textView: {
        width: "100%",
        flex: 12,
        backgroundColor: "#fff",
        textAlign: "center",
    },

    textArea: {
        flexDirection: "row",
        alignItems: "center"
    },

    numberInput: {
        flexDirection: "row",
        alignItems: "center",
        paddingBottom: 3,
    },

    toggleContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 5,
        paddingHorizontal: 1,
    },

    label: {
        fontSize: 13,
        color: '#333',
        marginBottom: 5,
        marginRight: 10,
        fontFamily: 'Arial',
    },

    toggleRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10
    },

    cardView: {
        backgroundColor: "#efefefAA",
        borderColor: "#454545AA",
        display: "flex",
        borderWidth: 3,
        borderRadius: 20,
        padding: 15,
        marginVertical: 5,
    },

    emptyIndicator: {
        marginRight: 5,
        marginLeft: 5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        borderWidth: 3,
        marginVertical: 2,
        paddingVertical: 1,
    },

    cameraControlView: {
        alignContent: "center",
        flexWrap: "wrap",
        marginTop: 10
    },

    icon: {
        width: 24
    },

    busImage: {
        width: "100%",
        aspectRatio: 16 / 9,
        resizeMode: "contain",
    },

    mobileKeyboardClose: {
        backgroundColor: "#ccc",
        padding: 2,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingRight: 10
    },

    mapsLink: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#0000EE",
        backgroundColor: "#E6F0FF",
        paddingTop: 2,
        borderRadius: "15%",
    }

});

export default styles;